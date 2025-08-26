import Replicate from "replicate";

let replicate: Replicate;

export function getReplicate() {
  if (replicate) {
    return replicate;
  }
  replicate = new Replicate({
    auth: process.env.REPLICATE_API_KEY!,
  });

  return replicate;
}
