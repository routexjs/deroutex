import { IBody } from "./body.ts";

const textEncoder = new TextEncoder();

export class TextBody implements IBody {
  public readonly contentType: string;

  public readonly body: string;

  public constructor(body: string, contentType = "text/plain") {
    this.body = body;
    this.contentType = contentType;
  }

  public toString = () => this.body;
  public toBuffer = () => {
    const buffer = new Deno.Buffer();
    buffer.writeSync(textEncoder.encode(this.body));
    return buffer;
  };
}
