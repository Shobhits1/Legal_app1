# Legal AI App - Complete Backend Implementation

A comprehensive legal AI application built with Next.js 14, TypeScript, Prisma ORM, and OpenAI integration for intelligent legal document processing and analysis.

## 🚀 Features

### Core Functionality
- **FIR Assistant**: AI-powered analysis of First Information Reports with legal section recommendations
- **Legal Sections Browser**: Comprehensive database of IPC and BNS sections with search and filtering
- **Case Laws Database**: Searchable repository of landmark judgments and legal precedents
- **Voice Input Processing**: Speech-to-text with translation capabilities
- **Universal Search**: Advanced search across all legal documents and sections
- **Reports & Analytics**: Comprehensive reporting system for legal analysis
- **User Management**: Secure authentication and role-based access control

### AI-Powered Features
- **Intelligent FIR Analysis**: GPT-4 powered analysis of incident descriptions
- **Legal Section Recommendations**: AI suggests relevant IPC/BNS sections
- **Case Law Matching**: Automatic matching of relevant case laws
- **Voice Transcription**: Real-time speech-to-text with legal terminology optimization
- **Multi-language Support**: Translation capabilities for regional languages

## 🛠️ Technology Stack

### Backend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Prisma ORM** with SQLite database
- **OpenAI GPT-4** for AI features
- **JWT Authentication** with secure cookies
- **Zod** for data validation

### Frontend
- **React 18** with modern hooks
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Lucide React** for icons
- **Framer Motion** for animations

### Database Schema
- **Users**: Authentication and profile management
- **FIRs**: First Information Reports with AI analysis
- **Legal Sections**: IPC and BNS sections with metadata
- **Case Laws**: Legal precedents and judgments
- **Documents**: File storage and management
- **Reports**: Analytics and reporting data
- **Favorites**: User bookmarks and preferences
- **Sessions**: User session management
- **System Logs**: Audit trail and system monitoring

## 📁 Project Structure

```
Legal_app/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── firs/                 # FIR management
│   │   ├── legal-sections/       # Legal sections API
│   │   ├── case-laws/            # Case laws API
│   │   ├── search/               # Universal search
│   │   ├── voice/                # Voice processing
│   │   ├── reports/              # Reports generation
│   │   ├── dashboard/            # Dashboard statistics
│   │   └── favorites/            # User favorites
│   ├── case_laws/                # Case laws frontend
│   ├── fir-assistant/            # FIR assistant frontend
│   ├── legal-sections/           # Legal sections frontend
│   ├── voice-input/              # Voice input frontend
│   ├── search/                   # Search frontend
│   ├── reports/                  # Reports frontend
│   ├── settings/                 # Settings frontend
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Dashboard
├── components/                   # Reusable components
│   ├── ui/                       # UI components
│   └── app-sidebar.tsx           # Application sidebar
├── lib/                          # Utility libraries
│   ├── db.ts                     # Database utilities
│   ├── auth.ts                   # Authentication utilities
│   ├── ai.ts                     # AI integration
│   └── utils.ts                  # General utilities
├── hooks/                        # Custom React hooks
├── prisma/                       # Database schema and migrations
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Database seeding
├── middleware.ts                 # Authentication middleware
└── package.json                  # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.9+ (for ML Service)
- npm or yarn
- OpenAI & Gemini API keys

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd Legal_app
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```
Edit `.env` with your actual configuration keys. Do not commit `.env` to version control!

3. **Set up the database:**
```bash
# Push Prisma schema to create the local SQLite database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed with sample case laws and sections
npx prisma db seed
```

4. **Set up the ML Service (Python):**
The FIR Assistant relies on a local Python Flask service for AI predictions and text processing.
```bash
cd ml-service

# Create a virtual environment
python -m venv .venv

# Activate the virtual environment
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the ML service
python app.py
```
*Note: The ML service runs on port 5000 by default. Keep this terminal open.*

5. **Start the Next.js development server:**
Open a new terminal window, navigate back to the root `Legal_app` directory, and run:
```bash
npm run dev
```

6. **Open your browser:**
Navigate to `http://localhost:3000`

## 🔐 Authentication

The application uses JWT-based authentication with secure HTTP-only cookies.

### Default Admin User
- **Email**: admin@legalai.com
- **Password**: admin123
- **Role**: ADMIN

### User Roles
- **ADMIN**: Full system access
- **OFFICER**: FIR management and legal analysis
- **USER**: Basic search and viewing capabilities

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### FIR Management
- `GET /api/firs` - List FIRs (with pagination and filters)
- `POST /api/firs` - Create new FIR
- `GET /api/firs/[id]` - Get specific FIR
- `PUT /api/firs/[id]` - Update FIR
- `DELETE /api/firs/[id]` - Delete FIR

### Legal Sections
- `GET /api/legal-sections` - List legal sections
- `GET /api/legal-sections/[id]` - Get specific section

### Case Laws
- `GET /api/case-laws` - List case laws
- `GET /api/case-laws/[id]` - Get specific case law

### Search
- `GET /api/search` - Universal search across all content

### Voice Processing
- `POST /api/voice/transcribe` - Transcribe audio to text

### Reports
- `GET /api/reports` - Generate various reports
- `GET /api/dashboard/stats` - Dashboard statistics

### Favorites
- `GET /api/favorites` - Get user favorites
- `POST /api/favorites` - Add to favorites
- `DELETE /api/favorites/[id]` - Remove from favorites

## 🤖 AI Integration

### OpenAI GPT-4 Features
- **FIR Analysis**: Intelligent analysis of incident descriptions
- **Legal Section Matching**: AI-powered section recommendations
- **Case Law Suggestions**: Relevant precedent identification
- **Voice Transcription**: Legal terminology optimized transcription
- **Multi-language Support**: Translation for regional languages

### AI Configuration
The AI integration is configured in `lib/ai.ts` with:
- Custom prompts for legal analysis
- Confidence scoring for recommendations
- Fallback handling for API failures
- Rate limiting and error handling

## 🗄️ Database Schema

### Key Models

#### User
```typescript
{
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'OFFICER' | 'USER'
  department?: string
  badgeNumber?: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### FIR
```typescript
{
  id: string
  firNumber: string
  title: string
  description: string
  incidentDate: DateTime
  location: string
  complainant: string
  accused?: string
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  primarySections: string // JSON array
  secondarySections: string // JSON array
  aiAnalysis: string // JSON object
  relevantCaseLaws: string // JSON array
  createdBy: string
  assignedTo?: string
  reviewedBy?: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Legal Section
```typescript
{
  id: string
  act: string
  section: string
  title: string
  description: string
  punishment: string
  essentials: string // JSON array
  category: string
  frequency: string
  relatedSections: string // JSON array
  createdAt: DateTime
  updatedAt: DateTime
}
```

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Database Management
```bash
npx prisma studio    # Open Prisma Studio
npx prisma db push   # Push schema changes
npx prisma generate  # Generate Prisma client
npx prisma db seed   # Seed database
```

### Code Quality
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality checks

## 🚀 Deployment

### Environment Setup
1. Set up production database (PostgreSQL recommended)
2. Configure environment variables
3. Set up OpenAI API key
4. Configure JWT secrets

### Build and Deploy
```bash
npm run build
npm run start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📈 Performance & Monitoring

### Database Optimization
- Indexed fields for fast queries
- Pagination for large datasets
- Connection pooling
- Query optimization

### API Performance
- Response caching
- Rate limiting
- Error handling
- Logging and monitoring

### Frontend Optimization
- Code splitting
- Lazy loading
- Image optimization
- Bundle analysis

## 🔒 Security

### Authentication & Authorization
- JWT tokens with secure cookies
- Role-based access control
- Session management
- Password hashing

### API Security
- Input validation with Zod
- SQL injection prevention
- CORS configuration
- Rate limiting

### Data Protection
- Encrypted sensitive data
- Audit logging
- Data backup strategies
- GDPR compliance considerations

## 🧪 Testing

### Test Structure
- Unit tests for utilities
- Integration tests for API endpoints
- E2E tests for critical workflows
- Database testing with test fixtures

### Running Tests
```bash
npm run test         # Run all tests
npm run test:unit    # Run unit tests
npm run test:integration # Run integration tests
npm run test:e2e     # Run E2E tests
```

## 📚 Documentation

### API Documentation
- OpenAPI/Swagger integration
- Endpoint documentation
- Request/response examples
- Error code reference

### User Guides
- Admin user guide
- Officer workflow guide
- User manual
- API integration guide

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Code review process

### Code Standards
- Follow TypeScript best practices
- Write comprehensive tests
- Document new features
- Follow commit message conventions

## 📞 Support

### Getting Help
- Check documentation
- Review existing issues
- Create detailed bug reports
- Contact development team

### Bug Reports
When reporting bugs, please include:
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Error logs and screenshots

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Prisma team for excellent ORM
- Next.js team for the framework
- Radix UI for accessible components
- Legal community for domain expertise

---

**Built with ❤️ for the legal community**