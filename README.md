# File Compressor

A web-based file compression application built with React, Vite, and TypeScript. This application allows users to compress images and PDFs with customizable target sizes and provides visual previews.

## Features

- Drag-and-drop file upload interface
- Support for JPG, PNG, WebP, and PDF files
- Image compression with customizable target size
- PDF compression with quality options
- Side-by-side preview of original and compressed files
- File size validation (5MB limit for free tier)
- Responsive design with Tailwind CSS

## Local Development

1. Clone the repository:
```bash
git clone <your-repo-url>
cd file-compressor
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open http://localhost:5173 in your browser

## Deployment

### Deploy to Vercel (Recommended)

1. Create a Vercel account at https://vercel.com
2. Install Vercel CLI:
```bash
npm install -g vercel
```

3. Login to Vercel:
```bash
vercel login
```

4. Deploy the application:
```bash
vercel
```

### Alternative Deployment Options

- **Netlify**: Connect your GitHub repository to Netlify for automatic deployments
- **GitHub Pages**: Build the project and deploy the `dist` folder
- **AWS/GCP/Azure**: Deploy using cloud platform services

## Build for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Technologies Used

- React 18
- Vite
- TypeScript
- Tailwind CSS
- browser-image-compression
- pdf-lib
- pdf.js
- react-dropzone

## License

MIT 