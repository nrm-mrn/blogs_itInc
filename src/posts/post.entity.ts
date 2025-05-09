import { ObjectId } from "mongodb"

export class Post {
  createdAt: string
  constructor(
    public title: string,
    public shortDescription: string,
    public content: string,
    public blogId: ObjectId,
    public blogName: string,
  ) {
    this.createdAt = new Date().toISOString()
  }
}
