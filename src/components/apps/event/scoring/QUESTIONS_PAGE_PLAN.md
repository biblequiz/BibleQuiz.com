# Questions Page Implementation Plan

This document outlines the plan to create a Questions management page for the BibleQuiz.com scoring system, based on the Windows Form `frmImportQuestions.cs` from the ScoreKeep app.

## Source Reference

The Windows Form is located at:
- `D:\Code\BibleQuiz-ModernApps\Apps\Scoring\ScoreKeep\frmImportQuestions.cs`
- `D:\Code\BibleQuiz-ModernApps\Apps\Scoring\ScoreKeep\frmImportQuestions.Designer.cs`

## Windows Form Layout Overview

The original form (`frmImportQuestions`) has these key UI elements:

### Left/Main Area
1. **`lsvQuestions`** - Data grid showing matches (rows) vs question numbers (columns)
   - Cells display point values with color coding:
     - 0 points = Black background
     - 10 points = White background
     - 20 points = Yellow background
     - 30 points = Green (PaleGreen) background
     - Other = Red (PaleVioletRed) background
   - Cell selection shows question text in preview area

### Bottom Left Area
2. **`txtPlainText`** - Plain text question preview (read-only TextBox)
3. **`webHtml`** - HTML question preview (WebBrowser control)
4. **`radPlainText` / `radHtml`** - Radio buttons to toggle between plain text and HTML view

### Bottom Right Area
5. **`txtQuestions`** - Analysis results TextArea showing:
   - Parsing errors
   - Set count validation (consistency check)
   - Question type counts (Quotation, Completion, Essence, etc.)

### Right Sidebar
6. **`lsvMeets`** - List of meets/divisions to select from
7. **`panQuestionCount`** - Panel showing question counts:
   - `txt10s` - Number of 10-point questions per match
   - `txt20s` - Number of 20-point questions per match
   - `txt30s` - Number of 30-point questions per match
   - `txtTotalQuestions` - Total questions per match

### Buttons
8. **`btnLoad`** - "Import Questions" button to load questions from file
9. **`btnClose`** - Close button

## API Service Reference

Use `AstroDatabaseQuestionsService` from `src/types/services/AstroDatabaseQuestionsService.ts`:

```typescript
// Get all question sets for a database
AstroDatabaseQuestionsService.getAllQuestionSets(auth, eventId, databaseId): Promise<OnlineDatabaseQuestionSet[]>

// Parse questions from uploaded file
AstroDatabaseQuestionsService.parseQuestions(auth, eventId, databaseId, meetId, formData): Promise<OnlineDatabaseQuestionSetManifest>

// Save/update a question set
AstroDatabaseQuestionsService.updateQuestionSet(auth, eventId, databaseId, questions): Promise<void>
```

### Key Types

```typescript
interface OnlineDatabaseQuestionSet {
    MeetId: number;
    HasScoringStarted: boolean;
    Matches: Record<number, OnlineDatabaseQuestionMatchSet>;
}

interface OnlineDatabaseQuestionMatchSet {
    Questions: Record<number, OnlineMatchQuestion>;
}

interface OnlineMatchQuestion {
    HtmlText: string;
    PlainText: string;
    Usage: MatchQuestionUsage;
    PointValue: number;
    IsChanged: boolean;
}

interface OnlineDatabaseQuestionSetManifest {
    Set: OnlineDatabaseQuestionSet;
    ErrorMessage: string | null;
}

enum MatchQuestionUsage {
    Regular = 0,
    Overtime = 1,
}
```

## Implementation Tasks

### 1. Create `ScoringDatabaseQuestionsPage.tsx`

Location: `src/components/apps/event/scoring/ScoringDatabaseQuestionsPage.tsx`

**Structure:**
```tsx
export default function ScoringDatabaseQuestionsPage() {
    // Get context from ScoringDatabaseProvider
    const { auth, eventId, databaseId, currentDatabase } = useOutletContext<ScoringDatabaseProviderContext>();
    
    // State
    const [questionSets, setQuestionSets] = useState<OnlineDatabaseQuestionSet[]>([]);
    const [selectedMeetId, setSelectedMeetId] = useState<number | null>(null);
    const [selectedQuestion, setSelectedQuestion] = useState<OnlineMatchQuestion | null>(null);
    const [viewMode, setViewMode] = useState<'plain' | 'html'>('plain');
    
    // Load question sets on mount
    useEffect(() => {
        AstroDatabaseQuestionsService.getAllQuestionSets(auth, eventId, databaseId)
            .then(setQuestionSets);
    }, []);
    
    // ... rest of implementation
}
```

**UI Layout (using Tailwind/DaisyUI):**
```
┌─────────────────────────────────────────────────────┬──────────────────────┐
│                                                     │ Select Division      │
│            Questions Grid                           │ ┌──────────────────┐ │
│   (match rows × question columns)                   │ │ Division List    │ │
│                                                     │ │ - Division A     │ │
│                                                     │ │ - Division B     │ │
│                                                     │ │ - Division C     │ │
├──────────────────────────┬──────────────────────────┤ └──────────────────┘ │
│                          │                          │                      │
│   Question Preview       │   Analysis Results       │ Question Counts      │
│   (Plain/HTML toggle)    │   (errors, validation)   │ ┌──────────────────┐ │
│                          │                          │ │ 10-pt: X         │ │
│                          │                          │ │ 20-pt: Y         │ │
│                          │                          │ │ 30-pt: Z         │ │
│                          │                          │ │ Total: N         │ │
└──────────────────────────┴──────────────────────────┴─┴──────────────────┴─┘
                                                [Import Questions] [Save Changes]
```

**Key Features:**
- Grid with color-coded cells based on point value
- Click cell to preview question text
- Toggle between plain text and HTML preview
- Show analysis/validation results
- Import questions button opens file dialog
- Save changes when approved

### 2. Create `QuestionImportDialog.tsx`

Location: `src/components/apps/event/scoring/meets/QuestionImportDialog.tsx`

**Purpose:** Modal dialog for importing questions from a file

**Props:**
```typescript
interface QuestionImportDialogProps {
    auth: AuthManager;
    eventId: string;
    databaseId: string;
    meetId: number;
    meetName: string;
    hasScoringStarted: boolean;
    onSave: (updatedSet: OnlineDatabaseQuestionSet) => void;
    onClose: () => void;
}
```

**Workflow:**
1. User selects a file (txt, rtf, doc, docx)
2. File is uploaded via `parseQuestions()` API
3. Results shown in preview:
   - Parsed questions grid
   - Any error messages from `ErrorMessage`
   - Point value distribution analysis
4. Warning if `hasScoringStarted` is true
5. User clicks "Approve" → calls `updateQuestionSet()` → triggers `onSave`
6. User clicks "Cancel" → triggers `onClose`

### 3. Update `EventRoot.tsx`

Location: `src/components/apps/event/EventRoot.tsx`

**Changes:**

1. Add import at top:
```typescript
import ScoringDatabaseQuestionsPage from './scoring/ScoringDatabaseQuestionsPage';
```

2. Add route under `ScoringDatabaseProvider` children:
```typescript
{
    path: "/:eventId/scoring/databases/:databaseId/questions",
    element: <ScoringDatabaseQuestionsPage />
},
```

3. Add sidebar entry in `buildDatabaseEntry()` function:
```typescript
{
    type: 'link' as const,
    label: "Questions",
    navigate: () => navigate(`${rootPath}/scoring/databases/${databaseId}/questions`),
    isCurrent: false,
    icon: "fas faQuestion"  // or "fas faFileLines"
},
```

### 4. Helper Components (Optional)

Consider creating these sub-components for cleaner code:

- **`QuestionCell.tsx`** - A cell component with point-value-based background color
- **`QuestionPreview.tsx`** - The plain/HTML toggle preview component
- **`QuestionAnalysis.tsx`** - The analysis panel showing validation results
- **`QuestionCountsPanel.tsx`** - The point value counts summary panel

## Color Coding Reference

From the Windows Form `QueryCellStyle`:
```csharp
switch (pointValue) {
    case 0:  e.Style.BackColor = Color.Black; break;
    case 10: e.Style.BackColor = Color.White; break;
    case 20: e.Style.BackColor = Color.Yellow; break;
    case 30: e.Style.BackColor = Color.PaleGreen; break;
    default: e.Style.BackColor = Color.PaleVioletRed; break;
}
```

Tailwind equivalents:
- 0 points: `bg-black text-white`
- 10 points: `bg-white text-black`
- 20 points: `bg-yellow-300 text-black`
- 30 points: `bg-green-200 text-black`
- Other: `bg-red-200 text-black`

## Question Type Analysis

The Windows Form tracks these question types by searching text:
- "QUOTATION" → Quotation
- "COMPLETION" → Completion
- "ESSENCE" → Essence
- "ANALYSIS" → Analysis
- "SCRIPTURE TEXT" → Scripture Text
- "COMPLETE ANSWER" → Complete Answer
- " STATEMENT " → Statement
- "PART ANSWER" → Part Answer
- "PART QUESTION" → Part Question
- "TITLED" → Section Titled

## Files to Create

1. `src/components/apps/event/scoring/ScoringDatabaseQuestionsPage.tsx`
2. `src/components/apps/event/scoring/meets/QuestionImportDialog.tsx`

## Files to Modify

1. `src/components/apps/event/EventRoot.tsx` - Add route and sidebar entry

## Testing Checklist

- [ ] Page loads and displays list of meets from database
- [ ] Selecting a meet loads its questions into the grid
- [ ] Clicking a cell shows the question text in preview
- [ ] Plain text / HTML toggle works correctly
- [ ] Analysis panel shows correct validation results
- [ ] Question counts panel shows correct totals
- [ ] Import button opens file selector
- [ ] File upload correctly parses questions
- [ ] Approval dialog shows parsed results
- [ ] Saving updates persists to server
- [ ] Warning shown when meet has started scoring
- [ ] Error handling for API failures

## Dependencies

Existing components to reference:
- `ScoringDatabaseMeetsPage.tsx` - Pattern for page structure
- `DivisionPlayoffsDialog.tsx` - Pattern for dialog structure
- `DivisionRankingDialog.tsx` - Pattern for dialog structure
- `ConfirmationDialog.tsx` - For approval/cancel dialogs
- `FontAwesomeIcon.tsx` - For icons