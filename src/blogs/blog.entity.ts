export class Blog {
  createdAt: string

  constructor(
    public name: string,
    public description: string,
    public websiteUrl: string,
    public isMembership: boolean) {
    this.name = name
    this.description = description
    this.websiteUrl = websiteUrl
    this.createdAt = new Date().toISOString()
    this.isMembership = isMembership
  }
}
