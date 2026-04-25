import crypto from "crypto";

export const webhooks = {
  verify: ({
    payload,
    signature,
    secret,
  }: {
    payload: string | Buffer;
    signature: string;
    secret: string;
  }): boolean => {
    const body =
      typeof payload === "string" ? payload : payload.toString("utf8");
    const expected = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    const expectedBuf = Buffer.from(expected, "hex");
    const signatureBuf = Buffer.from(signature, "hex");

    if (expectedBuf.length !== signatureBuf.length) return false;

    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  },
};
