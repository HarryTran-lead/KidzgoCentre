# Question Bank: Comprehensive Role in Teaching Ecosystem

## Executive Summary

The **Question Bank** is a centralized repository system in KidzgoCentre that serves as a critical component of the teaching ecosystem. It enables **admin-controlled question creation and management** with **teacher access for importing questions into homework**. The system supports AI-powered question generation, curriculum organization, and reusable content across multiple classes and teachers.

---

## 1. QUESTION BANK ARCHITECTURE

### Core Components

```
Question Bank System
├── Admin Portal (Question Management)
│   ├── Create/Edit/Delete Questions
│   ├── Bulk Import (CSV/Excel/XML)
│   ├── AI Question Generation
│   ├── Status Management (Active/Inactive)
│   └── Usage Tracking
├── Question Storage
│   ├── Database Records (id, questionText, type, options, etc.)
│   └── Metadata (difficulty, points, explanation, topic, tags)
└── Teacher Access
    ├── ImportFromBankModal (In Homework Creation)
    ├── Filter & Search
    ├── Select & Import
    └── Question Reuse
```

### Data Models

#### QuestionBankItem (Teacher View)
```typescript
{
  id: string;                    // Unique identifier
  questionText: string;          // Question content
  questionType: string;          // MultipleChoice, TrueFalse, TextInput, Essay, FillInBlank
  options: string[];            // Answer options
  correctAnswer: string;        // Index or text of correct answer
  points: number;               // Points for this question
  explanation?: string;         // Why answer is correct
  level?: 'Easy' | 'Medium' | 'Hard';  // Difficulty
  programId?: string;           // Associated program/course
  programName?: string;         // Course name
}
```

#### QuestionRow (Admin View)
```typescript
{
  id: string;
  content: string;              // Question text
  type: QuestionType;           // Type enum
  difficulty: DifficultyLevel;  // Easy/Medium/Hard
  category: string;             // Subject/Category
  course: string;               // Program name
  programId: string;            // Program ID
  branch: string;               // Branch/Location
  status: 'Đang hoạt động' | 'Tạm dừng';  // Active/Inactive
  createdAt: string;            // Creation timestamp
  usageCount: number;           // **KEY: How many times used in homework**
}
```

---

## 2. TEACHER ACCESS & QUESTION USAGE

### How Teachers Access Question Bank

#### **Location**: Homework Creation Flow
- **File**: `app/[locale]/portal/teacher/assignments/page.tsx`
- **Component**: `ImportFromBankModal` (lines 1910, 3083)
- **Trigger**: "Ngân hàng câu hỏi" (Question Bank) button in assignment creation modal

#### **Features Teachers Can Use**:

1. **Program Selection**
   - Filter questions by the program associated with their class
   - Auto-populates with the class's program

2. **Difficulty Level Filtering**
   - "ALL" (default)
   - "Dễ" (Easy)
   - "Trung bình" (Medium)
   - "Khó" (Hard)

3. **Search & Filter by Points**
   - Min/Max points range (0-100)
   - Searchable by question text

4. **Question Selection**
   - Multi-select checkbox for multiple questions
   - Only imports **multiple-choice questions**
   - Non-multiple-choice questions are filtered out

5. **Batch Import**
   - Import multiple questions at once
   - Reduces question duplication per teacher

```typescript
// ImportFromBankModal.tsx - Lines 262-269
const response = await fetchQuestionBankItems({
  programId: selectedProgramId || undefined,
  level: selectedLevel === "ALL" ? undefined : selectedLevel,
  pageNumber: 1,
  pageSize: 100,  // Fetch up to 100 questions
});
```

---

## 3. QUESTION TYPES & METADATA

### Supported Question Types

| Type | Description | AdminPanel | TeacherImport | Notes |
|------|-------------|-----------|---------------|-------|
| **MultipleChoice** | Trắc nghiệm | ✅ | ✅ | Most common, full support |
| **TextInput** | Nhập văn bản | ✅ | ❌ | Teachers can't import; for AI generation |
| **TrueFalse** | Đúng/Sai | ✅ | ❌ | Admin only |
| **Essay** | Tự luận | ✅ | ❌ | Admin only |
| **FillInBlank** | Điền trống | ✅ | ❌ | Admin only |

### Metadata Fields

```
Question Attributes:
├── Difficulty Level (Easy/Medium/Hard)
├── Points (0-∞, configurable per question)
├── Explanation (optional reasoning/answer key)
├── Topic/Subject (category)
├── Program/Course Association
├── Grammar Tags (for language courses)
├── Vocabulary Tags (for language courses)
├── Image/Audio/Video URLs (optional media)
└── Status (Active/Inactive)
```

### Question Normalization

Teachers can import questions with various correct answer formats:
- Numeric index: "0", "1", "2"
- Letter notation: "A", "B", "C"
- Text matching: Exact option text
- System normalizes automatically (ImportFromBankModal.tsx, lines 71-95)

---

## 4. HOMEWORK CREATION & QUESTION IMPORT FLOW

### How Questions Flow From Bank → Homework

#### **Step 1: Teacher Selects Questions**
```typescript
// ImportFromBankModal.tsx - Line 98
function toImportedQuestion(question: QuestionBankItem): ImportedQuestion {
  const correctIndex = normalizeCorrectIndex(question);
  return {
    id: crypto.randomUUID(),                    // NEW ID (copied, not referenced)
    question: question.questionText,
    options: question.options.map((option, index) => ({
      id: crypto.randomUUID(),
      text: option,
      isCorrect: index === correctIndex,
    })),
    explanation: question.explanation || undefined,
    points: question.points || 1,
  };
}
```

**Key Point**: Questions are **COPIED**, not referenced:
- Each import gets a NEW UUID
- Original bank question remains unchanged
- Modifications to homework question don't affect bank

#### **Step 2: Questions Added to Homework**
```typescript
// assignments/page.tsx - Line 1910
<ImportFromBankModal
  isOpen={showImportBankModal}
  onClose={() => setShowImportBankModal(false)}
  onImport={handleImportFromBank}  // Adds to homework.questions array
  selectedClassId={selectedClass}
  classesData={classes}
/>

const handleImportFromBank = (importedQuestions: BuilderQuestion[]) => {
  setQuestions((prev) => [...prev, ...importedQuestions]);
};
```

#### **Step 3: Homework Creation**
```typescript
// assignments/page.tsx - Line 2130
const result = await createMultipleChoiceHomework({
  title,
  description: description || undefined,
  classId: selectedClass,
  sessionId: selectedSession || undefined,
  dueAt: `${dueDate}T${dueTime}:00+07:00`,
  questions: apiQuestions,  // Questions with bank-copied data
});
```

### Important: Questions Are Copied, Not Referenced

| Aspect | Copy Approach | Reference Approach |
|--------|---------------|-------------------|
| **Current Implementation** | ✅ **USED** | ❌ Not used |
| **Storage** | Full question data in homework | ID reference only |
| **Reuse** | Yes, but independent copies | Yes, with updates sync |
| **Update Impact** | No impact (question in homework independent) | Would sync if bank updated |
| **Isolation** | Questions isolated per homework | Shared across uses |
| **Complexity** | Simple, no dependencies | Complex relationship tracking |

**Benefits of Copy Approach**:
- Teachers can modify imported questions per assignment
- No accidental changes to homework if bank updates
- No dependencies between bank and homework
- Better data integrity

---

## 5. ADMIN QUESTION BANK MANAGEMENT

### Admin Portal Location
- **Route**: `/{locale}/portal/admin/question-bank`
- **File**: `app/[locale]/portal/admin/question-bank/page.tsx`

### Admin Capabilities

#### **Create Questions**
- Fill form with: Program, Question Text, Type, Difficulty, Points, Options, Correct Answer, Explanation
- Multiple options for Multiple Choice
- Support for all 5 question types
- Real-time validation

#### **Edit Questions**
- Update any field
- Change difficulty level
- Modify explanation
- Adjust points

#### **Delete Questions**
- Soft delete (status = inactive)
- Or hard delete if never used

#### **Toggle Status**
- Activate/Deactivate questions
- Inactive questions hidden from teacher import
- Toggle endpoint: `/api/question-bank/{id}/toggle-status`

#### **Bulk Operations**
- Bulk import via CSV/Excel/XML templates
- Download templates: CSV, XLS, DOC, TXT formats
- Each file contains headers for all fields

#### **AI Question Generation** (Not Bulk Import)
```typescript
// AiCreatorModal.tsx
// Generates question drafts using AI
// Teacher can use drafts directly or save to bank
```

### Organization & Metadata

**By Program/Course**:
- Every question tied to programId
- Filtered by program in teacher import
- Supports multiple programs with different questions

**By Category/Subject**:
- Category field for subject/topic
- Can be blank or specific (e.g., "Grammar", "Vocabulary")

**By Difficulty**:
- Admin selects: Easy, Medium, Hard
- Teachers filter by difficulty when importing

### Usage Tracking

```typescript
// From admin/question-bank.ts - QuestionRow interface
usageCount: number;  // Tracked automatically
```

**How it works**:
- When question is imported into homework, usageCount increments
- Admins see in list: "Usage Count" column
- Helps identify popular questions
- Informs curriculum decisions

**Display in Admin Panel**:
```
Column: "usageCount" (Sortable)
Shows: 0, 1, 5, 12, etc.
```

---

## 6. CONNECTION TO LESSON PLANS & CURRICULUM

### Relationship to Lesson Plans

```
Lesson Plan
├── Topics/Skills
├── Learning Objectives
└── Assessment Methods
    └── → Can reference Question Bank
        ├── Questions organized by topic
        └── Questions by difficulty level
```

**Current Design**:
- Questions NOT directly embedded in lesson plans
- Teachers can see lesson topics and find matching questions in bank
- Questions organized by program (which has curriculum structure)

### Curriculum Alignment

**Supported Through**:
1. **Program-Based Organization**
   - Each program has its own questions
   - Different programs = different curricula

2. **Topic/Category Tags**
   - Questions tagged by subject/skill
   - Admin can organize by: Grammar, Vocabulary, Reading, Writing, etc.

3. **Difficulty Progression**
   - Easy → Medium → Hard aligns with curriculum levels
   - Teachers can scaffold difficulty in assignments

4. **Level/Grade Association** (Implicit)
   - Each program has associated levels
   - Questions within program match that program's grades

---

## 7. AI QUESTION GENERATION INTEGRATION

### AI-Powered Question Creation

#### **How Teachers Use AI**:
1. Click "Tạo câu hỏi bằng AI" button in assignment creation
2. Opens `AiCreatorModal` component
3. Specify: Program, Topic, Question Type, Difficulty, Count, Skill, Tags, Instructions

#### **Two Usage Paths**:

**Path 1: AI Drafts → Bank → Homework**
```
AI generates drafts
    ↓
Admin reviews drafts
    ↓
Save to Question Bank (if approved)
    ↓
Teachers import from Bank later
```

**Path 2: AI Drafts → Homework (Direct)**
```
AI generates drafts
    ↓
Teacher uses drafts immediately in homework
    ↓
Drafts NOT saved to bank
```

#### **Supported AI Generation Types**:
- MultipleChoice ✅
- TextInput ✅
- Custom grammar/vocabulary tags
- Language selection (Vi/En)
- Task styles: Standard, Translation

#### **API Endpoints**:
```
POST /api/question-bank/ai-generate
POST /api/question-bank/ai-generate/from-file
```

### AI Draft Structure
```typescript
{
  questionText: string;
  questionType: "MultipleChoice" | "TextInput";
  options: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
  topic?: string;
  skill?: string;
  grammarTags: string[];
  vocabularyTags: string[];
  level?: DifficultyLevel;
}
```

---

## 8. API ENDPOINTS & TECHNICAL INTEGRATION

### Main API Routes

```
Question Bank APIs:
├── GET /api/question-bank
│   └── Fetch all questions (with filters)
│       ├── Query: programId, level, pageNumber, pageSize
│       └── Used by: ImportFromBankModal
├── GET /api/question-bank/{id}
│   └── Get question detail
├── POST /api/question-bank
│   └── Create question (Admin only)
├── PUT /api/question-bank/{id}
│   └── Update question (Admin only)
├── DELETE /api/question-bank/{id}
│   └── Delete question (Admin only)
├── PATCH /api/question-bank/{id}/toggle-status
│   └── Toggle Active/Inactive
├── POST /api/question-bank/ai-generate
│   └── Generate AI question drafts
├── POST /api/question-bank/ai-generate/from-file
│   └── Generate AI questions from uploaded file
└── POST /api/question-bank/import
    └── Bulk import from CSV/Excel
```

### API Constants
```typescript
// From constants/apiURL.ts - Lines 1005-1026
QUESTION_BANK_ENDPOINTS: {
  GET_ALL: '/api/question-bank',
  GET_BY_ID: (id) => `/api/question-bank/${id}`,
  CREATE: '/api/question-bank',
  AI_GENERATE: '/api/question-bank/ai-generate',
  AI_GENERATE_FROM_FILE: '/api/question-bank/ai-generate/from-file',
  UPDATE: (id) => `/api/question-bank/${id}`,
  DELETE: (id) => `/api/question-bank/${id}`,
  TOGGLE_STATUS: (id) => `/api/question-bank/${id}/toggle-status`,
  IMPORT: '/api/question-bank/import',
}
```

### Service Functions
```typescript
// From lib/api/homeworkService.ts - Line 269
export async function fetchQuestionBankItems(
  params: FetchQuestionBankParams
): Promise<FetchQuestionBankResult>

// Parameters:
// - programId?: string
// - level?: 'Easy' | 'Medium' | 'Hard'
// - pageNumber?: number (default 1)
// - pageSize?: number (default 100)
```

---

## 9. QUESTION BANK BENEFITS & VALUE

### 1. **Reduces Duplication**
```
Without Bank:
├── Teacher A creates Q1
├── Teacher B creates same Q1 independently
├── Teacher C creates similar Q1
└── Result: 3 copies of same content

With Bank:
├── Teacher A creates Q1 once
├── Teacher B imports Q1
├── Teacher C imports Q1
└── Result: 1 source of truth
```

### 2. **Ensures Consistency**
- Same question format across all assignments
- Standardized difficulty levels
- Unified answer keys & explanations
- Curriculum alignment through program organization

### 3. **Enables Reuse Across Teachers**
```
Question Bank
├── Teacher A: Imports for Class 1
├── Teacher A: Imports for Class 2
├── Teacher B: Imports for Class 3
├── Teacher C: Imports for Classes 4-5
└── Students get same high-quality content
```

**Metrics**:
- `usageCount` field tracks reuse
- Admin can see popular questions
- Data-driven curriculum decisions

### 4. **Supports Curriculum Alignment**
- Questions organized by program (curriculum)
- Difficulty scaffolding (Easy → Medium → Hard)
- Topic/category organization
- Skill & grammar tag system
- Level-appropriate content per grade

### 5. **Scales Question Production**
```
Without AI: Admin/Teachers manually create questions
With AI: 
├── AI generates initial drafts
├── Admin reviews & approves
├── Saves to bank
└── Teachers reuse high-quality content
```

### 6. **Simplifies Teacher Workflow**
```
Teacher Assignment Creation:
├── Choose homework type
├── Select class
├── Set due date
├── Import from Bank (seconds, not hours)
└── Assign
```

### 7. **Data-Driven Decision Making**
- Usage count shows which questions teachers choose
- Difficulty distribution visible
- Program-level analytics possible
- Identify gaps in question coverage

---

## 10. KEY RELATIONSHIPS IN TEACHING ECOSYSTEM

### Question Bank in Context

```
┌─────────────────────────────────────────────────┐
│           Teaching Ecosystem Flow               │
├─────────────────────────────────────────────────┤
│                                                 │
│  Lesson Plan                                    │
│  ├── Topics/Skills                              │
│  ├── Learning Objectives                        │
│  └── Assessment Methods                         │
│      └─────────────────────────┐                │
│                                │                │
│                         Question Bank           │
│                         ├── MultiChoice Qs      │
│                         ├── By Program/Topic    │
│                         ├── By Difficulty       │
│                         ├── Usage Tracking      │
│                         └─────────────────────┐ │
│                                              │ │
│  Teacher Creates/Assigns Homework           │ │
│  ├── Selects Class                          │ │
│  ├── Imports from Bank ◄──────────────────┐ │ │
│  ├── Customizes if needed                │ │ │
│  └── Assigns to Students                 │ │ │
│      └──────┬──────────────────────────┘ │ │
│             │                             │ │
│  Student Submissions                      │ │
│  ├── Answers Multiple Choice Questions    │ │
│  ├── System Auto-grades                   │ │
│  ├── Gets Explanation from Bank           │ │
│  └── Receives Feedback                    │ │
│                                           │ │
│  AI Enhancement (Optional)                │ │
│  ├── Generate question drafts       ◄────┘ │
│  ├── Improve via API feedback             │
│  └── Save approved Qs to Bank             │
│                                           │
└─────────────────────────────────────────────────┘
```

### Component Dependencies

```typescript
Imports & Dependencies:
app/[locale]/portal/teacher/assignments/page.tsx
  ├── Imports: ImportFromBankModal
  │            AiCreatorModal
  │            fetchQuestionBankItems()
  │
  └── Creates: Homework with questions
              (copied from bank, not referenced)

app/[locale]/portal/admin/question-bank/page.tsx
  ├── Imports: fetchAdminQuestions
  │            createAdminQuestion
  │            updateAdminQuestion
  │            toggleQuestionStatus
  │            deleteAdminQuestion
  │
  └── Manages: Question Bank inventory
              Usage metrics
              Status & metadata
```

---

## 11. IMPLEMENTATION DETAILS

### Multiple Choice Question Validation

```typescript
// ImportFromBankModal.tsx - Lines 51-70
function isMultipleChoiceQuestion(question: QuestionBankItem) {
  const questionType = String(question.questionType || "")
    .trim()
    .replace(/[\s_-]+/g, "")
    .toLowerCase();

  // Check for explicit MC indicators
  if ([
    "multiplechoice",
    "multiplechoices",
    "mcq",
    "0",
  ].includes(questionType)) {
    return true;
  }

  // Fallback: Check if has options and correct answer
  return question.options.length >= 2 
    && Boolean(String(question.correctAnswer ?? "").trim());
}
```

### Answer Index Normalization

```typescript
// Handles various answer formats:
// "0" → index 0
// "1" → index 0 (if 1-indexed)
// "A" → index 0 (A is first)
// "B" → index 1 (B is second)
// Exact text match → find index
// Fallback → index 0
```

### Program-Based Filtering

```typescript
// Auto-detect class program when modal opens
useEffect(() => {
  if (!selectedClassId) return;
  
  // Try classesData first
  const selectedClass = classesData?.find(c => c.id === selectedClassId);
  if (selectedClass?.programId) {
    setClassProgramId(selectedClass.programId);
    setSelectedProgramId(selectedClass.programId); // Auto-select
    return;
  }
  
  // Fallback: Fetch from API
  const res = await fetch(`/api/teacher/classes/${selectedClassId}`);
  // Extract program from response
}, [isOpen, selectedClassId, classesData]);
```

---

## 12. DATA FLOW DIAGRAM

### Teacher Import Flow

```
Teacher starts assignment
  ↓
[Click "Ngân hàng câu hỏi"]
  ↓
ImportFromBankModal Opens
  ├─ Load Programs (getAllProgramsForDropdown)
  └─ Auto-select if class has program
  ↓
[Teacher filters]
  ├─ Select Program
  ├─ Select Difficulty (Easy/Medium/Hard)
  ├─ Set Min/Max Points
  └─ Search by text
  ↓
[API Call] GET /api/question-bank
  ├─ programId, level, pageNumber, pageSize
  └─ Returns: QuestionBankItem[]
  ↓
[Filter on Client]
  └─ Remove non-MultipleChoice questions
  ↓
[Display List]
  ├─ Checkbox per question
  ├─ Show: text, type, difficulty, points
  └─ Allow multi-select
  ↓
[Teacher clicks Import]
  ├─ Transform each selected question:
  │  ├─ Get new UUID
  │  ├─ Normalize correct answer index
  │  └─ Map to ImportedQuestion type
  └─ Add to homework.questions array
  ↓
[Continue Assignment Creation]
  └─ Teacher can add more questions
     or proceed to submit
```

### Admin Creation Flow

```
Admin visits question-bank page
  ↓
[Fetch existing questions]
  ├─ GET /api/question-bank
  └─ Display in table with: 
     - Type badge
     - Difficulty badge
     - Usage count
     - Status
     - Actions (edit/delete/toggle)
  ↓
[Click "Create Question"]
  ├─ Open QuestionModal
  └─ Form for:
     ├─ Program (required)
     ├─ Question Type
     ├─ Difficulty
     ├─ Points
     ├─ Question Text
     ├─ Options (for MC)
     ├─ Correct Answer
     └─ Explanation
  ↓
[Validate Form]
  ├─ Check program selected
  ├─ Check question text
  ├─ If MC: check ≥2 options
  ├─ If MC: check correct answer
  └─ Show error badges
  ↓
[Submit]
  ├─ POST /api/question-bank
  ├─ Send: { programId, items: [CreateQuestionItem] }
  └─ Success → Reload list
```

---

## 13. USAGE TRACKING EXAMPLE

### Real-World Scenario

```
Question Bank Question:
{
  id: "q-1001",
  questionText: "What is 2+2?",
  level: "Easy",
  programId: "prog-1",
  usageCount: 0
}

Timeline:
Day 1: Admin creates question
  → usageCount = 0

Day 2: Teacher A creates homework for Class 1
  → Imports question q-1001
  → usageCount = 1
  → Question copied to homework

Day 3: Teacher A creates homework for Class 2
  → Imports same question q-1001
  → usageCount = 2
  → Another copy in second homework

Day 4: Teacher B creates homework for Class 3
  → Imports same question q-1001
  → usageCount = 3
  → Third independent copy

Day 5: Admin views question-bank
  → Sees usageCount = 3
  → This question is popular!
  → Decides to promote it or expand variations

Bank Question remains unchanged:
{
  id: "q-1001",
  questionText: "What is 2+2?",  // Never modified
  level: "Easy",
  programId: "prog-1",
  usageCount: 3  // Only this incremented
}
```

---

## 14. LIMITATIONS & CONSIDERATIONS

### Current Limitations

1. **Teacher Import Only Supports Multiple Choice**
   - TextInput, TrueFalse, Essay, FillInBlank hidden from import
   - Only MC questions visible in ImportFromBankModal
   - Other types only available for admin use

2. **No Live Sync**
   - Questions are copied, not referenced
   - If bank question updated, homework copies unaffected
   - By design (isolation) but breaks consistency if needed

3. **Program-Based Organization Only**
   - No cross-program question sharing (by design)
   - No global question pool across programs
   - Limits reuse across different courses

4. **No Question Versioning**
   - Updates overwrite previous version
   - No history of changes
   - Can't revert to earlier version

5. **Limited Search Capabilities**
   - Search on question text only
   - No tag-based search (grammatical, vocabulary)
   - No advanced filters in teacher view

### Future Enhancement Opportunities

```
1. Teacher Question Creation
   └─ Allow teachers to add questions to bank
      (with admin approval workflow)

2. Question Versioning
   └─ Track changes over time
      Enable rollback/comparison

3. Cross-Program Sharing
   └─ Share questions across programs
      (with access controls)

4. Advanced Search
   └─ Full-text search
      Tag-based filtering
      Smart recommendations

5. Learning Path Integration
   └─ Embed questions in lesson plans
      Track skills mastery
      Adaptive question selection

6. Content Marketplace
   └─ Teachers contribute questions
      Share/sell content
      Community ratings
```

---

## 15. CONCLUSION

### Summary

The **Question Bank** is a **production-grade content management system** that serves as the central repository for assessment content in KidzgoCentre. It provides:

✅ **Admin Control**: Centralized creation, management, and quality assurance of assessment content
✅ **Teacher Efficiency**: Quick access to curated questions without duplicating effort
✅ **Curriculum Alignment**: Organization by program, difficulty, and topic
✅ **Scalability**: AI-powered generation for rapid content creation
✅ **Reusability**: Questions shared across classes while maintaining independence through copying
✅ **Data-Driven**: Usage tracking informs curriculum decisions
✅ **Extensibility**: Ready for future enhancements (versioning, cross-program sharing, etc.)

### Key Takeaways

1. **Questions are COPIED from bank to homework** (not referenced)
   - Independence & isolation
   - No unintended updates

2. **Admin-centric creation** with **teacher-centric consumption**
   - Quality control before teacher use
   - Teachers focus on assignment workflow, not question creation

3. **Program-based organization** aligns with curriculum structure
   - Questions belong to programs
   - Teachers import from relevant programs

4. **Difficulty levels enable scaffolding**
   - Easy → Medium → Hard progression
   - Supports learning objectives

5. **Usage tracking drives insights**
   - Popular questions identified
   - Curriculum gaps visible
   - Data-informed decisions

### Integration Points

- **In Homework Creation**: ImportFromBankModal for quick question selection
- **In AI Workflow**: Optional save-to-bank after generation
- **In Admin Portal**: Complete CRUD operations on question inventory
- **In Student Experience**: Explanations provided when grading multiple-choice

---

## 16. FILE REFERENCE GUIDE

### Key Implementation Files

| File | Purpose | Lines |
|------|---------|-------|
| `types/teacher/homework.ts` | Types: QuestionBankItem, FetchQuestionBankParams | 22-110 |
| `lib/api/homeworkService.ts` | Function: fetchQuestionBankItems() | 269-330 |
| `app/[locale]/portal/teacher/assignments/modal/ImportFromBankModal.tsx` | Teacher import UI component | 1-500 |
| `app/[locale]/portal/teacher/assignments/page.tsx` | Assignment creation (uses ImportFromBankModal) | 1900-2150 |
| `app/api/admin/question-bank.ts` | Admin API functions (CRUD, AI, import) | 1-350+ |
| `app/[locale]/portal/admin/question-bank/page.tsx` | Admin question management UI | 1-2000+ |
| `components/question-bank/AiCreatorModal.tsx` | AI question generation component | 1-500+ |
| `constants/apiURL.ts` | API endpoint constants | 1005-1026 |

### Related Types Files

- `types/teacher/homework.ts` - Question-related types
- `types/student/homework.ts` - Student homework/submission types
- `app/api/admin/question-bank.ts` - Admin types (QuestionRow, QuestionDetail, etc.)

---

## 17. FUTURE DOCUMENTATION NEEDS

When implementing new features, consider:

1. **Teacher-Contributed Questions**
   - Workflow for submission
   - Admin approval process
   - Attribution/credit system

2. **Question Versioning System**
   - Version history tracking
   - Comparison UI
   - Rollback capabilities

3. **Cross-Program Sharing**
   - Access control model
   - Sharing agreements
   - Licensing if applicable

4. **Analytics Dashboard**
   - Question usage trends
   - Difficulty distribution
   - Teacher preferences
   - Student performance by question

5. **Content Packaging**
   - Export question sets
   - Import from external sources
   - Standard formats (QTI, Moodle XML, etc.)
