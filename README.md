# Notewise - AI-Powered Learning Platform

Notewise is a modern web application designed to enhance the learning experience through AI-powered note-taking and study assistance. The platform helps students organize, process, and understand their study materials more effectively.

## 🎯 Core Learning Features

### AI-Powered Note Processing
- **Multi-Format Support**: Upload and process various document formats (PDF, DOCX, PPTX)
- **Smart Extraction**: AI-powered extraction of key concepts, definitions, and important information
- **Content Organization**: Automatic categorization and tagging of study materials
- **Knowledge Graph**: Builds connections between related concepts across different documents

### Interactive Learning Methods

#### Feynman Technique Integration
- **Teach-to-Learn**: Explain concepts as if teaching a beginner
- **AI Feedback**: Receive instant feedback on your explanations
- **Gap Identification**: AI identifies knowledge gaps in your understanding
- **Simplification Practice**: Learn to break down complex topics into simpler terms

#### Study Sessions
- **Focused Learning**: Timed study sessions with progress tracking
- **Active Recall**: AI-generated questions to test understanding
- **Spaced Repetition**: Smart scheduling of review sessions
- **Session Analytics**: Detailed insights into study patterns and effectiveness

### Progress Tracking
- **Learning Analytics**: Track progress across different subjects and topics
- **Knowledge Assessment**: Regular quizzes and assessments
- **Weakness Identification**: AI-powered analysis of areas needing improvement
- **Study Recommendations**: Personalized suggestions for review and practice

## 🎮 Gamification System

### Leveling System
- **XP-Based Progression**: Earn XP through various learning activities
- **Level Calculation**: Levels are calculated using the formula: `level = floor(sqrt(xp/100)) + 1`
- **Progressive Difficulty**: Higher levels require more XP to advance
- **Level Rewards**: Unlock new features and capabilities at higher levels

### Streak System
- **Daily Streaks**: Maintain a daily study streak for bonus XP
- **Streak Multiplier**: XP multiplier increases with longer streaks
- **Streak Protection**: Grace period for maintaining streaks
- **Streak Rewards**: Special badges and achievements for streak milestones

### Achievement System
- **Badges**: Earn badges for completing specific challenges
- **Categories**:
  - First Session
  - 7-Day Streak
  - Subject Mastery (e.g., Math Whiz, Science Star)
  - Study Milestones
- **Special Achievements**: Unique badges for exceptional performance

### Leaderboard
- **Global Rankings**: Compare progress with other users
- **Category Rankings**: Subject-specific leaderboards
- **Weekly/Monthly**: Different time-based leaderboards
- **Achievement Showcase**: Display earned badges and accomplishments

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.3.3
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **UI Components**: 
  - Radix UI (Dialog, Label, Radio Group, Scroll Area, Tabs)
  - Framer Motion (Animations)
  - Lucide React (Icons)
  - Sonner (Toast notifications)

### Backend
- **API Routes**: Next.js API Routes
- **Authentication**: Supabase Auth
- **Database**: Supabase
- **File Processing**:
  - PDF parsing (pdf-parse, pdf2json)
  - Word document processing (mammoth)
  - PowerPoint processing (pptx-parser, pptx2json)
  - Text extraction (textract)

### AI Integration
- OpenAI API integration
- Vapi AI integration for voice interactions

## 📁 Project Structure

```
notewise/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── components/        # Shared components
│   ├── dashboard/         # Dashboard pages
│   ├── history/          # History tracking
│   ├── login/            # Authentication
│   ├── progress/         # Progress tracking
│   ├── tutor/            # AI tutor interface
│   └── session/          # Study sessions
├── components/            # Global components
├── contexts/             # React contexts
├── lib/                  # Utility functions
├── public/              # Static assets
├── supabase/            # Supabase configuration
└── types/               # TypeScript type definitions
```

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create a `.env.local` file
   - Add required Supabase and OpenAI API keys

4. Run the development server:
   ```bash
   npm run dev
   ```

## 🔒 Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

## 📝 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. Please contact the maintainers for contribution guidelines.

## 📄 Document Processing System

### Supported File Formats
- **PDF Documents**
  - Text extraction with layout preservation
  - Support for multi-page documents
  - Handles embedded images and tables
- **PowerPoint Presentations**
  - Slide-by-slide text extraction
  - Preserves presentation structure
  - Handles tables and shapes
- **Word Documents**
  - Full text extraction
  - Format preservation
  - Support for headers and footers
- **Plain Text**
  - Direct text processing
  - UTF-8 encoding support

### Document Processing Flow

1. **Upload Process**
   - Drag-and-drop or file browser upload
   - File size limit: 50MB
   - Real-time format validation
   - Progress indicator during upload

2. **Text Extraction**
   - **PDF Processing**:
     - Uses `pdf-parse` and `pdf2json` for robust extraction
     - Maintains document structure and formatting
     - Handles complex layouts and tables
   
   - **PowerPoint Processing**:
     - Utilizes `pptx2json` for structured extraction
     - Preserves slide hierarchy
     - Extracts text from shapes and tables
     - Maintains presentation flow

3. **AI Analysis**
   - **Content Processing**:
     - OpenAI GPT integration for intelligent analysis
     - Key concept extraction
     - Topic identification
     - Relationship mapping between concepts
   
   - **Summary Generation**:
     - Concise overview of document content
     - Main points and key ideas
     - Student-friendly language
     - Customizable summary length

4. **Learning Integration**
   - **Knowledge Graph Creation**:
     - Maps relationships between concepts
     - Identifies prerequisite knowledge
     - Creates learning pathways
   
   - **Study Material Organization**:
     - Automatic categorization
     - Tag-based organization
     - Cross-reference generation
     - Related content suggestions

### User Flow

1. **Document Upload**
   ```
   User → Upload Interface → File Selection → Format Validation → Upload Progress
   ```

2. **Processing Pipeline**
   ```
   Upload → Text Extraction → AI Analysis → Summary Generation → Knowledge Graph
   ```

3. **Learning Integration**
   ```
   Processed Content → Study Session → Active Recall → Progress Tracking
   ```

### Technical Implementation

- **Backend Processing**:
  - Asynchronous file handling
  - Chunked processing for large files
  - Error handling and recovery
  - Progress tracking

- **Storage System**:
  - Supabase storage integration
  - Secure file handling
  - Efficient retrieval system
  - Version control support

- **AI Integration**:
  - OpenAI API for content analysis
  - Custom prompt engineering
  - Context-aware processing
  - Real-time feedback generation
