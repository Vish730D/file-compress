import React from 'react';

const blogPosts = [
  {
    id: 1,
    title: 'Understanding Image Compression',
    excerpt: 'Learn about different image compression techniques and when to use them.',
    content: `Image compression is essential for web performance. There are two main types of compression:
    lossy and lossless. Lossy compression reduces file size by removing some image data,
    while lossless compression maintains all original data...`,
    date: '2024-03-19',
    readTime: '5 min read'
  },
  {
    id: 2,
    title: 'PDF Compression Best Practices',
    excerpt: 'Optimize your PDF files without compromising quality.',
    content: `PDF compression can significantly reduce file sizes while maintaining document quality.
    Key techniques include image downsampling, font subsetting, and removing unnecessary metadata...`,
    date: '2024-03-19',
    readTime: '4 min read'
  },
  {
    id: 3,
    title: 'Web Performance and File Optimization',
    excerpt: 'How compressed files improve website loading speed.',
    content: `Website performance is crucial for user experience and SEO. Learn how proper file
    compression can improve your website's loading times and overall performance...`,
    date: '2024-03-19',
    readTime: '6 min read'
  }
];

const Blog: React.FC = () => {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Latest Articles</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <article key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {post.title}
                </h3>
                <div className="text-sm text-gray-500 mb-4">
                  <span>{post.date}</span>
                  <span className="mx-2">•</span>
                  <span>{post.readTime}</span>
                </div>
                <p className="text-gray-600 mb-4">
                  {post.excerpt}
                </p>
                <button
                  className="text-blue-600 hover:text-blue-800 font-medium"
                  onClick={() => console.log(`Read more about ${post.title}`)}
                >
                  Read more →
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Blog; 