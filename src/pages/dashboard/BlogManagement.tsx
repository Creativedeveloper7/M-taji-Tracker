import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image_url: string;
  category: string;
  status: 'draft' | 'published';
  author_id: string;
  author_name: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  initiative_id: string | null;
  initiative_name?: string;
}

interface BlogFormData {
  title: string;
  excerpt: string;
  content: string;
  image_url: string;
  category: string;
  status: 'draft' | 'published';
  initiative_id: string | null;
}

interface Initiative {
  id: string;
  name: string;
}

interface BlogComment {
  id: string;
  blog_id: string;
  commenter_name: string;
  comment: string;
  is_approved: boolean;
  created_at: string;
  blog_title?: string;
}

const categories = [
  'Impact Stories',
  'Transparency',
  'Technology',
  'Youth',
  'Guide',
  'Government',
  'Community',
  'News',
];

const initialFormData: BlogFormData = {
  title: '',
  excerpt: '',
  content: '',
  image_url: '',
  category: 'Impact Stories',
  status: 'draft',
  initiative_id: null,
};

export default function BlogManagement() {
  const { user, userProfile, completeProfile } = useAuth();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState<BlogFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Comments state
  const [activeTab, setActiveTab] = useState<'blogs' | 'comments'>('blogs');
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // Fetch user's initiatives
  useEffect(() => {
    const fetchInitiatives = async () => {
      // Use changemaker id from completeProfile, fallback to user.id
      const changemakerId = completeProfile?.changemaker?.id;
      
      if (!changemakerId) {
        console.log('No changemaker ID found, cannot fetch initiatives');
        return;
      }

      try {
        console.log('Fetching initiatives for changemaker:', changemakerId);
        const { data, error } = await supabase
          .from('initiatives')
          .select('id, title')
          .eq('changemaker_id', changemakerId)
          .order('title', { ascending: true });

        if (error) throw error;
        // Map title to name for our interface
        const mapped = (data || []).map(i => ({ id: i.id, name: i.title }));
        console.log('Found initiatives:', mapped);
        setInitiatives(mapped);
      } catch (err) {
        console.error('Error fetching initiatives:', err);
      }
    };

    fetchInitiatives();
  }, [completeProfile]);

  // Fetch comments on user's blogs
  const fetchComments = async () => {
    if (!user) return;

    try {
      setLoadingComments(true);
      
      // First get all blog IDs for this user
      const { data: userBlogs, error: blogsError } = await supabase
        .from('blogs')
        .select('id, title')
        .eq('author_id', user.id);

      if (blogsError) throw blogsError;
      
      if (!userBlogs || userBlogs.length === 0) {
        setComments([]);
        return;
      }

      const blogIds = userBlogs.map(b => b.id);
      const blogTitles = new Map(userBlogs.map(b => [b.id, b.title]));

      // Fetch all comments for these blogs
      const { data: commentsData, error: commentsError } = await supabase
        .from('blog_comments')
        .select('*')
        .in('blog_id', blogIds)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      // Add blog titles to comments
      const commentsWithTitles = (commentsData || []).map(c => ({
        ...c,
        blog_title: blogTitles.get(c.blog_id) || 'Unknown Blog'
      }));

      setComments(commentsWithTitles);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  // Fetch comments when tab changes to comments
  useEffect(() => {
    if (activeTab === 'comments') {
      fetchComments();
    }
  }, [activeTab, user]);

  // Delete a comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('blog_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => prev.filter(c => c.id !== commentId));
      setSuccess('Comment deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment');
    }
  };

  // Get author name based on profile
  const getAuthorName = () => {
    if (completeProfile?.organization?.organization_name) {
      return completeProfile.organization.organization_name;
    }
    if (completeProfile?.government_entity?.entity_name) {
      return completeProfile.government_entity.entity_name;
    }
    if (completeProfile?.political_figure?.name) {
      return completeProfile.political_figure.name;
    }
    if (completeProfile?.changemaker?.name) {
      return completeProfile.changemaker.name;
    }
    return userProfile?.email || 'Anonymous';
  };

  // Fetch blogs
  useEffect(() => {
    fetchBlogs();
  }, [user]);

  const fetchBlogs = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlogs(data || []);
    } catch (err: any) {
      console.error('Error fetching blogs:', err);
      setError('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploadingImage(true);
      setError(null);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image must be less than 5MB');
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `blog-images/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('initiative-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('initiative-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      setSuccess('Image uploaded successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Open modal for creating new blog
  const openCreateModal = () => {
    setEditingBlog(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
    setError(null);
  };

  // Open modal for editing existing blog
  const openEditModal = (blog: BlogPost) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      excerpt: blog.excerpt,
      content: blog.content,
      image_url: blog.image_url,
      category: blog.category,
      status: blog.status,
      initiative_id: blog.initiative_id,
    });
    setIsModalOpen(true);
    setError(null);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBlog(null);
    setFormData(initialFormData);
    setError(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!formData.excerpt.trim()) {
      setError('Excerpt is required');
      return;
    }
    if (!formData.content.trim()) {
      setError('Content is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Get initiative name if linked
      const linkedInitiative = initiatives.find(i => i.id === formData.initiative_id);

      const blogData = {
        title: formData.title.trim(),
        excerpt: formData.excerpt.trim(),
        content: formData.content.trim(),
        image_url: formData.image_url || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop&q=60',
        category: formData.category,
        status: formData.status,
        author_id: user.id,
        author_name: getAuthorName(),
        updated_at: new Date().toISOString(),
        published_at: formData.status === 'published' ? new Date().toISOString() : null,
        initiative_id: formData.initiative_id,
        initiative_name: linkedInitiative?.name || null,
      };

      if (editingBlog) {
        // Update existing blog
        const { error } = await supabase
          .from('blogs')
          .update(blogData)
          .eq('id', editingBlog.id);

        if (error) throw error;
        setSuccess('Blog updated successfully');
      } else {
        // Create new blog
        const { error } = await supabase
          .from('blogs')
          .insert([{
            ...blogData,
            created_at: new Date().toISOString(),
          }]);

        if (error) throw error;
        setSuccess('Blog created successfully');
      }

      await fetchBlogs();
      closeModal();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving blog:', err);
      setError(err.message || 'Failed to save blog');
    } finally {
      setSaving(false);
    }
  };

  // Delete blog
  const handleDelete = async (blogId: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;

    try {
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', blogId);

      if (error) throw error;
      setSuccess('Blog deleted successfully');
      await fetchBlogs();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting blog:', err);
      setError('Failed to delete blog');
    }
  };

  // Toggle publish status
  const togglePublishStatus = async (blog: BlogPost) => {
    const newStatus = blog.status === 'published' ? 'draft' : 'published';
    
    try {
      const { error } = await supabase
        .from('blogs')
        .update({
          status: newStatus,
          published_at: newStatus === 'published' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', blog.id);

      if (error) throw error;
      setSuccess(`Blog ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`);
      await fetchBlogs();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error updating blog status:', err);
      setError('Failed to update blog status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">Blog Management</h1>
          <p className="text-gray-800 dark:text-secondary mt-1 font-medium">Create and manage your blog posts</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-6 py-3 bg-mtaji-accent text-white rounded-lg font-semibold hover:bg-mtaji-accent/90 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Post
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-subtle">
        <button
          onClick={() => setActiveTab('blogs')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'blogs'
              ? 'text-mtaji-accent'
              : 'text-secondary hover:text-primary'
          }`}
        >
          My Blogs ({blogs.length})
          {activeTab === 'blogs' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-mtaji-accent" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'comments'
              ? 'text-mtaji-accent'
              : 'text-secondary hover:text-primary'
          }`}
        >
          Comments ({comments.length})
          {activeTab === 'comments' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-mtaji-accent" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'blogs' ? (
        <>
        {/* Blog List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mtaji-accent"></div>
        </div>
      ) : blogs.length === 0 ? (
        <div className="bg-secondary rounded-xl p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-700 dark:text-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <h3 className="text-xl font-semibold text-primary mb-2">No Blog Posts Yet</h3>
          <p className="text-gray-800 dark:text-secondary mb-6 font-medium">Start sharing your stories and insights with the community.</p>
          <button
            onClick={openCreateModal}
            className="px-6 py-3 bg-mtaji-accent text-white rounded-lg font-semibold hover:bg-mtaji-accent/90 transition-colors"
          >
            Create Your First Post
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {blogs.map(blog => (
            <div
              key={blog.id}
              className="bg-secondary rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row gap-4"
            >
              {/* Image */}
              <div className="w-full sm:w-40 h-32 sm:h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                {blog.image_url ? (
                  <img
                    src={blog.image_url}
                    alt={blog.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-secondary">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    blog.status === 'published' 
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {blog.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    {blog.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-primary line-clamp-1">{blog.title}</h3>
                <p className="text-gray-800 dark:text-secondary text-sm line-clamp-2 mt-1">{blog.excerpt}</p>
                {blog.initiative_name && (
                  <p className="text-xs text-mtaji-accent mt-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Linked to: {blog.initiative_name}
                  </p>
                )}
                <p className="text-xs text-secondary mt-2">
                  {blog.status === 'published' && blog.published_at
                    ? `Published ${new Date(blog.published_at).toLocaleDateString()}`
                    : `Last updated ${new Date(blog.updated_at).toLocaleDateString()}`
                  }
                </p>
              </div>

              {/* Actions */}
              <div className="flex sm:flex-col gap-2 sm:justify-center">
                <button
                  onClick={() => openEditModal(blog)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => togglePublishStatus(blog)}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    blog.status === 'published'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                  }`}
                >
                  {blog.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  onClick={() => handleDelete(blog.id)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      ) : (
        /* Comments Tab */
        <div>
          {loadingComments ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mtaji-accent"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="bg-secondary rounded-xl p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-700 dark:text-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-xl font-semibold text-primary mb-2">No Comments Yet</h3>
              <p className="text-gray-800 dark:text-secondary font-medium">Comments on your published blogs will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map(comment => (
                <div
                  key={comment.id}
                  className="bg-secondary rounded-xl p-4 sm:p-6"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-mtaji-accent/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-mtaji-accent">
                        {comment.commenter_name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Comment Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-primary">{comment.commenter_name}</span>
                        <span className="text-xs text-gray-700 dark:text-secondary">
                          {new Date(comment.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 dark:text-secondary mb-2 whitespace-pre-wrap">{comment.comment}</p>
                      <p className="text-xs text-mtaji-accent">
                        On: <span className="font-medium">{comment.blog_title}</span>
                      </p>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors flex-shrink-0"
                      title="Delete comment"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/60 transition-opacity"
              onClick={closeModal}
            />

            {/* Modal */}
            <div className="relative bg-primary rounded-2xl text-left overflow-hidden shadow-xl transform transition-all w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-primary border-b border-subtle px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-bold text-primary">
                  {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-primary mb-2">
                    Featured Image
                  </label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Preview */}
                    <div className="w-full sm:w-48 h-32 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                      {formData.image_url ? (
                        <img
                          src={formData.image_url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-secondary">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {/* Upload Controls */}
                    <div className="flex-1 space-y-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="w-full px-4 py-2 border-2 border-dashed border-subtle rounded-lg text-secondary hover:border-mtaji-accent hover:text-mtaji-accent transition-colors disabled:opacity-50"
                      >
                        {uploadingImage ? 'Uploading...' : 'Upload Image'}
                      </button>
                      <p className="text-xs text-gray-700 dark:text-secondary">Or paste image URL:</p>
                      <input
                        type="url"
                        value={formData.image_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-4 py-2 bg-secondary border border-subtle rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-mtaji-accent"
                      />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-primary mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter blog title"
                    className="w-full px-4 py-3 bg-secondary border border-subtle rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-mtaji-accent"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-primary mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 bg-secondary border border-subtle rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-mtaji-accent"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Link to Initiative */}
                <div>
                  <label className="block text-sm font-semibold text-primary mb-2">
                    Link to Initiative
                    <span className="text-gray-700 dark:text-secondary font-normal ml-2">(Optional)</span>
                  </label>
                  <select
                    value={formData.initiative_id || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, initiative_id: e.target.value || null }))}
                    className="w-full px-4 py-3 bg-secondary border border-subtle rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-mtaji-accent"
                  >
                    <option value="">No initiative linked</option>
                    {initiatives.map(initiative => (
                      <option key={initiative.id} value={initiative.id}>
                        {initiative.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-secondary mt-1">
                    Link this blog to one of your initiatives. The blog will appear on the initiative's page.
                  </p>
                  {initiatives.length === 0 && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                      You don't have any initiatives yet. Create an initiative first to link blogs.
                    </p>
                  )}
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-sm font-semibold text-primary mb-2">
                    Excerpt <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Write a brief summary of your blog post (displayed on blog cards)"
                    rows={3}
                    className="w-full px-4 py-3 bg-secondary border border-subtle rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-mtaji-accent resize-none"
                    required
                  />
                  <p className="text-xs text-gray-700 dark:text-secondary mt-1">{formData.excerpt.length}/300 characters recommended</p>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-semibold text-primary mb-2">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your blog content here...

Separate paragraphs with a blank line for proper spacing.

You can also use HTML tags for advanced formatting:
<h2>Section Heading</h2>
<p>Your paragraph text here.</p>
<blockquote>A quote or important statement</blockquote>
<ul>
  <li>Bullet point 1</li>
  <li>Bullet point 2</li>
</ul>"
                    rows={16}
                    className="w-full px-4 py-3 bg-secondary border border-subtle rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-mtaji-accent resize-y text-sm"
                    required
                  />
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-1">Formatting Tips:</p>
                    <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                      <li>• <strong>Paragraphs:</strong> Press Enter twice (blank line) to create new paragraphs</li>
                      <li>• <strong>Headings:</strong> Use &lt;h2&gt;Your Heading&lt;/h2&gt;</li>
                      <li>• <strong>Bold:</strong> Use &lt;strong&gt;bold text&lt;/strong&gt;</li>
                      <li>• <strong>Quotes:</strong> Use &lt;blockquote&gt;quote text&lt;/blockquote&gt;</li>
                      <li>• <strong>Lists:</strong> Use &lt;ul&gt;&lt;li&gt;item&lt;/li&gt;&lt;/ul&gt;</li>
                    </ul>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-primary mb-2">
                    Status
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="draft"
                        checked={formData.status === 'draft'}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' }))}
                        className="w-4 h-4 text-mtaji-accent"
                      />
                      <span className="text-primary">Save as Draft</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="published"
                        checked={formData.status === 'published'}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' }))}
                        className="w-4 h-4 text-mtaji-accent"
                      />
                      <span className="text-primary">Publish Now</span>
                    </label>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-subtle">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-6 py-3 bg-secondary text-primary rounded-lg font-semibold hover:bg-opacity-80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-mtaji-accent text-white rounded-lg font-semibold hover:bg-mtaji-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving && (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    )}
                    {editingBlog ? 'Update Post' : 'Create Post'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
