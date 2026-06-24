const Blog = require('../models/Blog');
const { blogSchema, blogUpdateSchema } = require('../Validators/blogValidators');
const { ZodError } = require('zod');

// ✅ Add blog
exports.addBlog = async (req, res) => {
  try {
    const data = blogSchema.parse(req.body);
    const imageUrls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const blog = new Blog({ ...data, imageUrls });
    await blog.save();

    res.status(201).json(blog);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    console.error('Error creating blog:', err);
    res.status(500).json({ error: 'Failed to create blog' });
  }
};

// ✅ Get blogs by user
exports.getUserBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ authorId: req.params.id }).sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    console.error('Error fetching blogs:', err);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
};

// ✅ Get single blog
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.json(blog);
  } catch (err) {
    console.error('Error fetching blog by ID:', err);
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
};

// ✅ Get all blogs
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    console.error('Error fetching all blogs:', err);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
};

// ✅ Delete blog
exports.deleteBlog = async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Blog deleted successfully' });
  } catch (err) {
    console.error('Error deleting blog:', err);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
};

// ✅ Update blog
exports.updateBlog = async (req, res) => {
  try {
    const updateData = blogUpdateSchema.parse(req.body);

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    res.json(blog);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    console.error('Error updating blog:', err);
    res.status(500).json({ error: 'Failed to update blog' });
  }
};