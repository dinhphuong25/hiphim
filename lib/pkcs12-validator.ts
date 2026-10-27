import crypto from "crypto";

interface Asn1Node {
  tag: number;
  len: number;
  headerLen: number;
  totalLen: number;
  value: Buffer;
  raw: Buffer;
}

function parseAsn1(buf: Buffer, offset = 0): Asn1Node | null {
  if (offset >= buf.length) return null;
  const start = offset;
  const tag = buf[offset++];
  let len = buf[offset++];
  if (len & 0x80) {
    const numBytes = len & 0x7f;
    len = 0;
    for (let i = 0; i < numBytes; i++) {
      len = (len << 8) | buf[offset++];
    }
  }
  const headerLen = offset - start;
  const value = buf.subarray(offset, offset + len);
  return {
    tag,
    len,
    headerLen,
    totalLen: headerLen + len,
    value,
    raw: buf.subarray(start, start + headerLen + len),
  };
}

/**
 * PKCS#12 Key Derivation Function (RFC 7292 Appendix B)
 */
function pkcs12Kdf(
  idByte: number,
  n: number,
  salt: Buffer,
  pwd: string,
  iters: number,
  alg: "sha1" | "sha256"
): Buffer {
  const u = alg === "sha1" ? 20 : 32;
  const v = 64; // Block size for SHA-1 and SHA-256
  const D = Buffer.alloc(v, idByte);

  const sLen = salt.length;
  let S = Buffer.alloc(0);
  if (sLen > 0) {
    const sCount = Math.ceil(sLen / v) * v;
    const sBuf = Buffer.alloc(sCount);
    for (let i = 0; i < sCount; i++) sBuf[i] = salt[i % sLen];
    S = sBuf;
  }

  // Password in BMPString (UTF-16BE + 2 trailing zero bytes)
  const passBuf = Buffer.alloc((pwd.length + 1) * 2);
  for (let i = 0; i < pwd.length; i++) {
    passBuf.writeUInt16BE(pwd.charCodeAt(i), i * 2);
  }
  passBuf.writeUInt16BE(0, pwd.length * 2);

  const pLen = passBuf.length;
  let P = Buffer.alloc(0);
  if (pLen > 0) {
    const pCount = Math.ceil(pLen / v) * v;
    const pBuf = Buffer.alloc(pCount);
    for (let i = 0; i < pCount; i++) pBuf[i] = passBuf[i % pLen];
    P = pBuf;
  }

  const I = Buffer.concat([S, P]);
  const c = Math.ceil(n / u);
  const out = Buffer.alloc(n);

  for (let i = 1; i <= c; i++) {
    let A = Buffer.concat([D, I]);
    for (let iter = 0; iter < iters; iter++) {
      A = crypto.createHash(alg).update(A).digest();
    }
    const copyLen = Math.min(u, n - (i - 1) * u);
    A.copy(out, (i - 1) * u, 0, copyLen);

    if (i < c) {
      const B = Buffer.alloc(v);
      for (let j = 0; j < v; j++) B[j] = A[j % u];

      // Big-integer addition: I = I + B + 1
      for (let j = 0; j < I.length; j += v) {
        let carry = 1;
        for (let k = v - 1; k >= 0; k--) {
          const sum = I[j + k] + B[k] + carry;
          I[j + k] = sum & 0xff;
          carry = sum >> 8;
        }
      }
    }
  }

  return out;
}

export interface P12VerifyResult {
  isP12: boolean;
  requiresPassword: boolean;
  isValid: boolean;
  reason?: "missing_password" | "wrong_password" | "ok" | "no_mac" | "error";
  error?: string;
}

export function verifyP12Password(p12Buf: Buffer, password = ""): P12VerifyResult {
  try {
    const outer = parseAsn1(p12Buf);
    if (!outer || outer.tag !== 0x30) {
      return { isP12: false, requiresPassword: false, isValid: false, error: "Định dạng không phải ASN.1 PKCS#12 hợp lệ" };
    }

    let off = 0;
    const version = parseAsn1(outer.value, off);
    if (!version || version.tag !== 0x02) {
      return { isP12: false, requiresPassword: false, isValid: false, error: "Phiên bản PKCS#12 không hợp lệ" };
    }
    off += version.totalLen;

    const authSafe = parseAsn1(outer.value, off);
    if (!authSafe || authSafe.tag !== 0x30) {
      return { isP12: false, requiresPassword: false, isValid: false, error: "Cấu trúc authSafe không hợp lệ" };
    }
    off += authSafe.totalLen;

    // Check if macData exists
    const macData = parseAsn1(outer.value, off);
    if (!macData || macData.tag !== 0x30) {
      // ShroudedKeyBag OID: 1.2.840.113549.1.12.10.1.2
      const shroudedOid = Buffer.from([0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x0c, 0x0a, 0x01, 0x02]);
      const hasEncryptedKey = p12Buf.indexOf(shroudedOid) !== -1;
      return {
        isP12: true,
        requiresPassword: hasEncryptedKey,
        isValid: hasEncryptedKey ? password.length > 0 : true,
        reason: hasEncryptedKey ? (password.length > 0 ? "ok" : "missing_password") : "no_mac",
      };
    }

    // Extract authSafe OCTET STRING content to hash
    let authSafeData: Buffer | null = null;
    let asOff = 0;
    const asOid = parseAsn1(authSafe.value, asOff);
    if (asOid) asOff += asOid.totalLen;
    const asContent = parseAsn1(authSafe.value, asOff);
    if (asContent && asContent.tag === 0xa0) {
      const innerOctet = parseAsn1(asContent.value, 0);
      if (innerOctet && innerOctet.tag === 0x04) {
        authSafeData = innerOctet.value;
      }
    }
    if (!authSafeData) {
      authSafeData = authSafe.value;
    }

    // Parse macData
    let mOff = 0;
    const digestInfo = parseAsn1(macData.value, mOff);
    if (!digestInfo) {
      return { isP12: true, requiresPassword: true, isValid: password.length > 0, reason: password.length > 0 ? "ok" : "missing_password" };
    }
    mOff += digestInfo.totalLen;

    const macSalt = parseAsn1(macData.value, mOff);
    if (!macSalt || macSalt.tag !== 0x04) {
      return { isP12: true, requiresPassword: true, isValid: password.length > 0, reason: password.length > 0 ? "ok" : "missing_password" };
    }
    mOff += macSalt.totalLen;

    let iterations = 1;
    const iterAsn = parseAsn1(macData.value, mOff);
    if (iterAsn && iterAsn.tag === 0x02) {
      iterations = 0;
      for (let i = 0; i < iterAsn.value.length; i++) {
        iterations = (iterations << 8) | iterAsn.value[i];
      }
    }

    // Parse digestInfo -> Algorithm + Expected Digest
    let diOff = 0;
    const algId = parseAsn1(digestInfo.value, diOff);
    if (algId) diOff += algId.totalLen;
    const digestOctet = parseAsn1(digestInfo.value, diOff);
    if (!digestOctet || digestOctet.tag !== 0x04) {
      return { isP12: true, requiresPassword: true, isValid: password.length > 0, reason: password.length > 0 ? "ok" : "missing_password" };
    }

    const expectedDigest = digestOctet.value;
    let hashAlg: "sha1" | "sha256" = "sha1";
    if (expectedDigest.length === 32) hashAlg = "sha256";
    else if (expectedDigest.length === 20) hashAlg = "sha1";

    // 1. Check if an empty password satisfies the MAC
    const emptyKey = pkcs12Kdf(3, expectedDigest.length, macSalt.value, "", iterations, hashAlg);
    const emptyMac = crypto.createHmac(hashAlg, emptyKey).update(authSafeData).digest();
    const emptyWorks = emptyMac.equals(expectedDigest);

    if (emptyWorks) {
      return {
        isP12: true,
        requiresPassword: false,
        isValid: true,
        reason: "ok",
      };
    }

    // Certificate requires a non-empty password!
    if (!password) {
      return {
        isP12: true,
        requiresPassword: true,
        isValid: false,
        reason: "missing_password",
      };
    }

    // 2. Verify with user-provided password
    const userKey = pkcs12Kdf(3, expectedDigest.length, macSalt.value, password, iterations, hashAlg);
    const userMac = crypto.createHmac(hashAlg, userKey).update(authSafeData).digest();
    const userWorks = userMac.equals(expectedDigest);

    return {
      isP12: true,
      requiresPassword: true,
      isValid: userWorks,
      reason: userWorks ? "ok" : "wrong_password",
    };
  } catch (err: any) {
    return {
      isP12: false,
      requiresPassword: true,
      isValid: false,
      reason: "error",
      error: err.message || "Lỗi kiểm tra chứng chỉ",
    };
  }
}
