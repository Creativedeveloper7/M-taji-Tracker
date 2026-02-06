import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import { supabase } from '../lib/supabase'

// Blog post interface
interface BlogPost {
  id: string
  title: string
  excerpt: string
  category: string
  image_url: string
  author_name: string
  published_at: string
  read_time: string
  is_featured?: boolean
}

// Featured Kenyan sample blogs - these always display alongside user content
const sampleKenyanBlogs: BlogPost[] = [
  {
    id: 'sample-1',
    title: 'NYOTA Programme: 100,000 Kenyan Youth to Receive KES 50,000 Business Capital',
    excerpt: 'President Ruto launches the National Youth Opportunities Towards Advancement (NYOTA) programme, targeting unemployed youth aged 18-29 with entrepreneurship support and business capital across all 1,450 wards.',
    category: 'Youth',
    image_url: 'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=800&auto=format&fit=crop&q=80',
    author_name: 'M-taji Team',
    published_at: '2026-01-20',
    read_time: '6 min read',
    is_featured: true
  },
  {
    id: 'sample-2',
    title: 'Silicon Savannah: How Nairobi Became Africa\'s Tech Innovation Hub',
    excerpt: 'From iHub to Konza Technopolis, explore how Kenya\'s capital has emerged as a global top-60 startup ecosystem, attracting international investors and nurturing homegrown fintech giants.',
    category: 'Technology',
    image_url: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&auto=format&fit=crop&q=80',
    author_name: 'Tech Desk',
    published_at: '2026-01-15',
    read_time: '8 min read',
    is_featured: true
  },
  {
    id: 'sample-3',
    title: 'Maasai Conservancies: How 17,000 Landowners Are Protecting the Mara',
    excerpt: 'The Maasai Mara Wildlife Conservancies model has united 17,304 landowners across 207,586 hectares, creating one of Africa\'s most successful community-led conservation landscapes.',
    category: 'Community',
    image_url: 'https://images.unsplash.com/photo-1547970810-dc1eac37d174?w=800&auto=format&fit=crop&q=80',
    author_name: 'Conservation Watch',
    published_at: '2026-01-10',
    read_time: '7 min read',
    is_featured: true
  },
  {
    id: 'sample-4',
    title: 'Village Enterprise: Over 143,000 First-Time Entrepreneurs Trained in Kenya',
    excerpt: 'The poverty graduation programme has launched 44,729 businesses across Kenya, transforming nearly 930,000 lives through entrepreneurship training and seed capital.',
    category: 'Impact Stories',
    image_url: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800&auto=format&fit=crop&q=80',
    author_name: 'Impact Team',
    published_at: '2026-01-05',
    read_time: '5 min read'
  },
  {
    id: 'sample-5',
    title: 'Women of Marsabit: Transforming Livelihoods Through Agribusiness',
    excerpt: 'The Manyata Konso Women Group in Marsabit County has built climate resilience through beekeeping, irrigation ponds, and nutritious crop farming with support from Oxfam and NORAD.',
    category: 'Impact Stories',
    image_url: 'https://images.unsplash.com/photo-1594708767771-a7502f9c8cc1?w=800&auto=format&fit=crop&q=80',
    author_name: 'Community Stories',
    published_at: '2025-12-28',
    read_time: '6 min read'
  },
  {
    id: 'sample-6',
    title: 'M-Shamba & Digital Agriculture: 1.1 Million Kenyan Farmers Connected',
    excerpt: 'The Kenya Agricultural Observatory Platform and mobile apps like M-Shamba are revolutionizing farming with real-time weather data, agronomic advice, and market linkages.',
    category: 'Technology',
    image_url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
    author_name: 'AgriTech Kenya',
    published_at: '2025-12-20',
    read_time: '7 min read'
  },
  {
    id: 'sample-7',
    title: 'Northern Kenya\'s Brighter Futures: Food Security in the ASALs',
    excerpt: 'The Northern Rangelands Trust initiative has excavated 60 earth pans and installed water tanks, benefiting over 600 people in Kenya\'s arid and semi-arid lands.',
    category: 'Community',
    image_url: 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=800&auto=format&fit=crop&q=80',
    author_name: 'NRT Kenya',
    published_at: '2025-12-15',
    read_time: '5 min read'
  },
  {
    id: 'sample-8',
    title: 'Twiga Foods & Mkulima Young: Connecting Farmers Directly to Markets',
    excerpt: 'Kenya\'s 95 digital agriculture services are reducing middlemen and empowering smallholder farmers with direct market access and fair prices for their produce.',
    category: 'Technology',
    image_url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80',
    author_name: 'Market Watch',
    published_at: '2025-12-10',
    read_time: '6 min read'
  },
  {
    id: 'sample-9',
    title: 'KYEOP Success: 125,000 Jobs Created for Kenyan Youth',
    excerpt: 'The Kenya Youth Employment and Opportunities Project increased youth employment rates from 70% to 85% and boosted earnings by 50% for participants.',
    category: 'Youth',
    image_url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80',
    author_name: 'Employment Desk',
    published_at: '2025-12-05',
    read_time: '5 min read'
  },
  {
    id: 'sample-10',
    title: 'Konza Technopolis: Kenya\'s Smart City Rising Southeast of Nairobi',
    excerpt: 'The €35 million Silicon Savannah Innovation Park features cutting-edge research centers in AI, manufacturing, health tech, and green engineering, backed by France-Kenya partnership.',
    category: 'Technology',
    image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
    author_name: 'Innovation Hub',
    published_at: '2025-11-28',
    read_time: '8 min read'
  },
  {
    id: 'sample-11',
    title: 'M-Pesa\'s Legacy: How Kenya Became a Global Fintech Pioneer',
    excerpt: 'From mobile money to digital banking, Kenya\'s fintech revolution continues to inspire innovations worldwide, with M-taji building on this foundation for transparent impact tracking.',
    category: 'Technology',
    image_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
    author_name: 'Fintech Today',
    published_at: '2025-11-20',
    read_time: '7 min read'
  },
  {
    id: 'sample-12',
    title: 'Community Health Volunteers: 300 Youth Trained in Machakos County',
    excerpt: 'PEACE Kenya\'s TB Community Systems Strengthening Project has empowered young Kenyans to serve their communities as frontline health workers.',
    category: 'Community',
    image_url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80',
    author_name: 'Health Watch',
    published_at: '2025-11-15',
    read_time: '5 min read'
  }
]

// Category colors
const categoryColors: Record<string, string> = {
  'Impact Stories': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'Transparency': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'Technology': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  'Youth': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'Guide': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Government': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'Community': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  'News': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
}

// Available categories
const categories = ['All', 'Impact Stories', 'Transparency', 'Technology', 'Youth', 'Guide', 'Government', 'Community', 'News']

const BLOGS_PER_PAGE = 12

const Blog = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch published blogs from database and merge with sample blogs
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('blogs')
          .select('id, title, excerpt, category, image_url, author_name, published_at, read_time')
          .eq('status', 'published')
          .order('published_at', { ascending: false })

        if (error) {
          console.log('Database not ready, using sample blogs only')
          // Use only sample blogs if database isn't set up yet
          setBlogs(sampleKenyanBlogs)
        } else {
          // Merge user blogs with sample blogs, user blogs appear first
          const userBlogs = data || []
          const allBlogs = [...userBlogs, ...sampleKenyanBlogs]
          setBlogs(allBlogs)
        }
      } catch (err) {
        console.error('Error fetching blogs:', err)
        // Fallback to sample blogs on error
        setBlogs(sampleKenyanBlogs)
      } finally {
        setLoading(false)
      }
    }

    fetchBlogs()
  }, [])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, searchQuery])

  // Filter blogs based on category and search
  const filteredBlogs = blogs.filter(blog => {
    const matchesCategory = selectedCategory === 'All' || blog.category === selectedCategory
    const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredBlogs.length / BLOGS_PER_PAGE)
  const startIndex = (currentPage - 1) * BLOGS_PER_PAGE
  const endIndex = startIndex + BLOGS_PER_PAGE
  const paginatedBlogs = filteredBlogs.slice(startIndex, endIndex)

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    return pages
  }

  return (
    <div className="min-h-screen bg-primary">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-mtaji-primary/10 to-mtaji-accent/10">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-4">
            M-taji Blog
          </h1>
          <p className="text-lg text-secondary max-w-2xl mx-auto">
            Stories, insights, and updates from the world of community-driven development and transparent impact tracking.
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-subtle">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 rounded-lg border border-subtle bg-secondary text-primary focus:outline-none focus:ring-2 focus:ring-mtaji-accent"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-mtaji-accent text-white'
                      : 'bg-secondary text-secondary hover:bg-mtaji-accent/10'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtaji-accent"></div>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-primary">No articles found</h3>
              <p className="mt-2 text-secondary">
                {blogs.length === 0 
                  ? 'No blog posts have been published yet. Check back soon!'
                  : 'Try adjusting your search or filter to find what you\'re looking for.'}
              </p>
            </div>
          ) : (
            <>
            {/* Results count */}
            <div className="mb-6 text-secondary text-sm">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredBlogs.length)} of {filteredBlogs.length} articles
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedBlogs.map(blog => (
                <Link
                  key={blog.id}
                  to={`/blog/${blog.id}`}
                  className="bg-secondary rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer block"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={blog.image_url || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop&q=60'}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Category Badge */}
                    <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold ${categoryColors[blog.category] || 'bg-gray-100 text-gray-800'}`}>
                      {blog.category}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-secondary mb-3">
                      <span>{blog.published_at ? new Date(blog.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Draft'}</span>
                      <span>•</span>
                      <span>{blog.read_time || '5 min read'}</span>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-primary mb-3 line-clamp-2 group-hover:text-mtaji-accent transition-colors">
                      {blog.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-secondary text-sm line-clamp-3 mb-4">
                      {blog.excerpt}
                    </p>

                    {/* Author & Read More */}
                    <div className="flex items-center justify-between pt-4 border-t border-subtle">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-mtaji-accent/20 flex items-center justify-center">
                          <span className="text-xs font-semibold text-mtaji-accent">
                            {blog.author_name?.charAt(0) || 'A'}
                          </span>
                        </div>
                        <span className="text-sm text-secondary">{blog.author_name || 'Anonymous'}</span>
                      </div>
                      <span className="text-sm font-medium text-mtaji-accent group-hover:text-mtaji-accent/80 flex items-center gap-1">
                        Read More
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                {/* Previous Button */}
                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.max(prev - 1, 1))
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  disabled={currentPage === 1}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-600 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400'
                      : 'bg-secondary text-primary hover:bg-mtaji-accent hover:text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-2">
                  {getPageNumbers().map((page, index) => (
                    typeof page === 'number' ? (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentPage(page)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className={`w-10 h-10 rounded-lg font-medium transition-all ${
                          currentPage === page
                            ? 'bg-mtaji-accent text-white'
                            : 'bg-secondary text-primary hover:bg-mtaji-accent/20'
                        }`}
                      >
                        {page}
                      </button>
                    ) : (
                      <span key={index} className="px-2 text-secondary">
                        {page}
                      </span>
                    )
                  ))}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.min(prev + 1, totalPages))
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  disabled={currentPage === totalPages}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-600 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400'
                      : 'bg-secondary text-primary hover:bg-mtaji-accent hover:text-white'
                  }`}
                >
                  Next
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
            </>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-mtaji-primary to-mtaji-accent">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Stay Updated
          </h2>
          <p className="text-white/80 mb-6">
            Subscribe to our newsletter for the latest stories and updates from M-taji.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button className="px-6 py-3 bg-white text-mtaji-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-secondary border-t border-subtle">
        <div className="max-w-7xl mx-auto text-center text-secondary text-sm">
          <p>&copy; {new Date().getFullYear()} M-taji. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default Blog
