import hashlib,zlib,os,sys
n=7794519039342401251888804953617150949935142886482815803852012451656161273489517799328625172139290119759989054368057963203482182176782195840905585216445821
d=3209507839729224044895390275018826861738000012081159448644946303623125230260316885521009891818759797033563776925630182374777018962413875612683062525381045
k=64
def mgf1(seed,length):
    out=b'';c=0
    while len(out)<length:
        out+=hashlib.sha1(seed+c.to_bytes(4,'big')).digest();c+=1
    return out[:length]
def oaep_decode(em,label=b''):
    hlen=20;lhash=hashlib.sha1(label).digest()
    if len(em)!=k: em=em.rjust(k,b'\x00')
    Y=em[0];maskedSeed=em[1:1+hlen];maskedDB=em[1+hlen:]
    seed=bytes(a^b for a,b in zip(maskedSeed,mgf1(maskedDB,hlen)))
    DB=bytes(a^b for a,b in zip(maskedDB,mgf1(seed,k-hlen-1)))
    rest=DB[hlen:];i=0
    while i<len(rest) and rest[i]==0: i+=1
    return rest[i+1:] if i<len(rest) else b''
def dec_file(path):
    data=open(path,'rb').read()
    if len(data)%k!=0: return None,'not aligned (%d)'%len(data)
    allmsg=b''
    for bi in range(len(data)//k):
        blk=data[bi*k:(bi+1)*k]
        m=pow(int.from_bytes(blk,'big'),d,n).to_bytes(k,'big')
        allmsg+=oaep_decode(m)
    try:
        return zlib.decompress(allmsg),None
    except Exception as e:
        return None,'zlib:%s'%e

root='/tmp/zookkit/app/Scripts'
out='/tmp/decrypted'
os.makedirs(out,exist_ok=True)
results={}
for dirp,_,files in os.walk(root):
    for fn in files:
        if fn.endswith('.ssx'):
            p=os.path.join(dirp,fn)
            rel=os.path.relpath(p,root)
            plain,err=dec_file(p)
            if plain is not None:
                op=os.path.join(out,rel)
                os.makedirs(os.path.dirname(op),exist_ok=True)
                open(op,'wb').write(plain)
                results[rel]=('OK',len(plain))
            else:
                results[rel]=('FAIL',err)
for rel in sorted(results):
    print(rel, results[rel])
