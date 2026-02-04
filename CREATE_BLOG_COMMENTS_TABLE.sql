-- Create blog comments table for M-taji blog commenting feature
-- Run this in your Supabase SQL Editor

-- Create the blog_comments table
CREATE TABLE IF NOT EXISTS public.blog_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    blog_id UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
    commenter_name TEXT NOT NULL,
    comment TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_blog_comments_blog_id ON public.blog_comments(blog_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_created_at ON public.blog_comments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running the script)
DROP POLICY IF EXISTS "Anyone can read approved comments" ON public.blog_comments;
DROP POLICY IF EXISTS "Anyone can create comments" ON public.blog_comments;
DROP POLICY IF EXISTS "Blog authors can manage comments" ON public.blog_comments;

-- Policy: Anyone can read approved comments on published blogs
CREATE POLICY "Anyone can read approved comments"
ON public.blog_comments
FOR SELECT
USING (
    is_approved = true
    AND EXISTS (
        SELECT 1 FROM public.blogs 
        WHERE blogs.id = blog_comments.blog_id 
        AND blogs.status = 'published'
    )
);

-- Policy: Anyone can create comments (no login required)
CREATE POLICY "Anyone can create comments"
ON public.blog_comments
FOR INSERT
WITH CHECK (true);

-- Policy: Blog authors can read all comments on their blogs (including unapproved)
CREATE POLICY "Blog authors can read all comments"
ON public.blog_comments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.blogs 
        WHERE blogs.id = blog_comments.blog_id 
        AND blogs.author_id = auth.uid()
    )
);

-- Policy: Blog authors can delete comments on their blogs
CREATE POLICY "Blog authors can delete comments"
ON public.blog_comments
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.blogs 
        WHERE blogs.id = blog_comments.blog_id 
        AND blogs.author_id = auth.uid()
    )
);

-- Policy: Blog authors can update comments on their blogs (for approval)
CREATE POLICY "Blog authors can update comments"
ON public.blog_comments
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.blogs 
        WHERE blogs.id = blog_comments.blog_id 
        AND blogs.author_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.blogs 
        WHERE blogs.id = blog_comments.blog_id 
        AND blogs.author_id = auth.uid()
    )
);

-- Grant permissions
GRANT ALL ON public.blog_comments TO authenticated;
GRANT SELECT, INSERT ON public.blog_comments TO anon;

-- Add comment to table
COMMENT ON TABLE public.blog_comments IS 'Comments on M-taji blog posts';

-- Verification query
SELECT 
    'blog_comments table created successfully' AS status,
    COUNT(*) AS policy_count
FROM pg_policies 
WHERE tablename = 'blog_comments';
