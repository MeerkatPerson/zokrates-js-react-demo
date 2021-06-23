'''
# **************************************************************************************************
# (1)

from Crypto.Hash import SHA256

from ast import literal_eval

hash_result = SHA256.new(data=("13"+"31").encode()).hexdigest() 

# dec = literal_eval(hash_result)

# dec = int(hash_result, 16)

# string_dec = str(dec)

print(hash_result)

# print(dec)

# half_dec = int(len(string_dec)/2)

# print(f"First half: {string_dec[0:half_dec-1]}")

# print(f"Second half: {string_dec[half_dec:len(string_dec)-1]}")

# **************************************************************************************************
# (2)

import hashlib  

preimage = bytes.fromhex('00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00\
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 05 33')

preimg_bin = bin(int(preimage.hex(), 16)) # binary representation of pre-image 
# output is '0b101'

print(preimg_bin)

out = hashlib.sha256(preimage).hexdigest() # compute hash
# output is
#'c6481e22c5ff4164af680b8cfaa5e8ed3120eeff89c4f307c4a6faaae059ce10'

print(out)

out_dec = int(out, 16)

out_str = str(out_dec)

half_str = int(len(out_str)/2)

print(f"First half: {out_str[0:half_str-1]}")

print(f"Second half: {out_str[half_str:len(out_str)-1]}")

print(hex(26356159976655061728925005819981476068565303172752238645975888084098459749904))

'''

# **************************************************************************************************
# (3)

# import hashlib

# import zokrates_pycrypto.utils as zok_ut

from zokrates_pycrypto.utils import to_bytes, hashlib

bidBin = to_bytes("13")
nonceBin = to_bytes("31")
terminalMsg = hashlib.sha256(bidBin + nonceBin).digest()

# Pad with 256bit since implemented eddsa expects a 512bit message
terminalMsg = terminalMsg + to_bytes(int(0))

M0 = terminalMsg.hex()[:64]

print(M0)

