import { db } from "../db/db";
import { PostInputModel, PostViewModel } from "../db/db-types";

export const postsRepository = {

  async createPost(input: PostInputModel): Promise<{ post: PostViewModel | null, error: string | null }> {
    const parentBlog = db.blogs.find(b => b.id === input.blogId)
    if (!parentBlog) {
      return { post: null, error: 'BlogId does not exist' }
    }
    const newPost: PostViewModel = {
      id: (Date.now() + Math.random()).toString(),
      blogName: parentBlog.name,
      ...input
    }
    try {
      db.posts = [...db.posts, newPost]
    } catch (e: any) {
      return { post: null, error: e.message }
    }

    return { post: newPost, error: null }
  },

  async findPostById(id: string): Promise<PostViewModel | undefined> {
    return db.posts.find(b => b.id === id);
  },

  async editPost(id: string, input: PostInputModel | PostViewModel): Promise<{ error: string } | undefined> {
    const target = await this.findPostById(id);
    if (!target) {
      return { error: 'Id does not exist' }
    }
    const updatedPost = { id: target.id, blogName: target.blogName, ...input }
    const targetIdx = db.posts.findIndex(b => b.id === id);
    db.posts.splice(targetIdx, 1, updatedPost)
    return
  },

  async updatePostsByBlogId(blogId: string, input: Partial<PostViewModel>) {
    const targetPosts = await this.findPostsByBlogId(blogId)
    for (const post of targetPosts) {
      const updated: PostViewModel = { ...post, ...input }
      await this.editPost(updated.id, updated)
    }
    return
  },

  async findPostsByBlogId(blogId: string) {
    const targetPosts: PostViewModel[] = db.posts.filter(p => p.blogId === blogId)
    return targetPosts
  },

  async deletePostsByBlogId(blogId: string) {
    const posts = await this.findPostsByBlogId(blogId)
    if (!posts.length) {
      return
    }
    posts.forEach(post => {
      this.deletePost(post.id)
    })
  },

  async deletePost(id: string): Promise<{ error: string } | undefined> {
    const targetIdx = db.posts.findIndex(b => b.id === id)
    if (targetIdx < 0) {
      return { error: 'Id does not exist' }
    }
    db.posts.splice(targetIdx, 1);
    return
  }
}
