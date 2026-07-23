import type { MemoryCategory, ExtractedMemory } from './types'

// Common occupation/role patterns for robust "I am a/an" matching
const OCCUPATION_PATTERNS = [
  // Suffix-based roles: engineer, designer, developer, manager, analyst, etc.
  /\b\w+(er|ist|ian|or|ant|ent|eer|man|ess|eer)\b/i,
  // Known two-word role prefixes
  /\b(software|data|web|full.?stack|frontend|backend|devops|system|network|security|product|project|program|sales|marketing|business|financial|research|machine learning|ai|ml|cloud|platform|quality|test|support|customer|community|content|creative|art|design|ux|ui|graphic|motion|video|photo|fashion|interior|industrial)\s+\w+/i,
  // Known seniority/level prefixes
  /\b(senior|junior|lead|principal|staff|associate|assistant|head|chief|director|vp|svp|evp|executive|coordinator|supervisor|manager)\s+\w+/i,
  // Exact known role titles
  /^(ceo|cto|coo|cfo|cmo|cro|cio|founder|cofounder|intern|freelancer|consultant|contractor|administrator|technician|operator|representative|agent|advisor|officer|engineer|scientist|researcher|professor|teacher|instructor|trainer|coach|lawyer|attorney|doctor|physician|nurse|surgeon|dentist|therapist|psychologist|accountant|auditor|architect|plumber|electrician|mechanic|carpenter|developer|designer|analyst|writer|editor|journalist|photographer|artist|musician|actor|director|producer|chef|cook|baker|pilot|driver|policeman|firefighter|soldier|farmer|gardener|librarian|economist|statistician|mathematician|physicist|chemist|biologist|pharmacist|veterinarian|optician|chiropractor|nutritionist|dietitian|counselor|priest|minister|rabbi|imam|monk|nun|missionary|volunteer|activist|advocate|lobbyist|politician|senator|congressman|governor|mayor|judge|prosecutor|paralegal|mediator|arbitrator|notary|bailiff|clerk|secretary|receptionist|apprentice|trainee|fellow|scholar|specialist|practitioner|provider|supplier|vendor|distributor|retailer|wholesaler|broker|dealer|trader|merchant|banker|lender|borrower|investor|financier|underwriter|actuary|adjuster|appraiser|assessor|surveyor|inspector|examiner|tester|bookkeeper|cashier|teller|typist|stenographer|transcriber|translator|interpreter|linguist|philologist|etymologist|lexicographer|terminologist)$/i
]

function isLikelyOccupation(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.length < 2 || trimmed.length > 60) return false
  for (const pattern of OCCUPATION_PATTERNS) {
    if (pattern.test(trimmed)) return true
  }
  return false
}

/**
 * Smart Memory Extractor: analyzes user message and chat conversation
 * to extract stable facts, explicit preferences, long-term goals, or ongoing projects.
 * Ignores temporary greetings, random questions, and one-time requests.
 */
export function extractMemoriesFromMessage(message: string, aiResponse?: string): ExtractedMemory[] {
  const memories: ExtractedMemory[] = []
  const lowerMsg = message.toLowerCase().trim()

  // Ignore transient queries, greetings, or short prompts
  if (lowerMsg.length < 5 || /^(hi|hello|hey|greetings|sup)\s|^(good morning|good evening)\b/i.test(lowerMsg)) {
    return []
  }

  // 1. Profile detection (Name, Occupation, Language)
  if (/\bmy name is\s+([a-zA-Z\s]+)/i.test(message)) {
    const match = message.match(/\bmy name is\s+([a-zA-Z\s]+)/i)
    if (match && match[1]) {
      memories.push({
        category: 'profile',
        key: 'User Name',
        value: match[1].trim(),
        confidence: 0.95,
      })
    }
  }

  if (/\bi am a(?:n)?\s+([a-zA-Z\s]+)/i.test(message)) {
    const match = message.match(/\bi am a(?:n)?\s+([a-zA-Z\s]+)/i)
    if (match && match[1] && isLikelyOccupation(match[1])) {
      memories.push({
        category: 'profile',
        key: 'User Occupation',
        value: match[1].trim(),
        confidence: 0.9,
      })
    }
  }

  // 2. Preferences detection (Language, Writing Style, Response length)
  if (/\b(prefer|like)\s+(speaking|writing|communicating|to chat)\s+in\s+(bangla|bengali|english|spanish|french|german)/i.test(message)) {
    const match = message.match(/\b(bangla|bengali|english|spanish|french|german)/i)
    if (match) {
      memories.push({
        category: 'preference',
        key: 'Preferred Language',
        value: match[1].trim(),
        confidence: 0.95,
      })
    }
  }

  if (/\b(prefer|like)\s+(short|concise|detailed|long|explanatory)\s+responses/i.test(message)) {
    const match = message.match(/\b(short|concise|detailed|long|explanatory)\b/i)
    if (match) {
      memories.push({
        category: 'preference',
        key: 'Response Length Preference',
        value: match[1].trim(),
        confidence: 0.9,
      })
    }
  }

  // Explicit preference or setting statements ("I prefer...", "I always want...")
  // Avoid double-capturing language/response-length preferences
  if (/^i prefer\s+(?!(speaking|writing|communicating|to chat)\s+in|short\s|concise\s|detailed\s|long\s|explanatory\s)(.+)/i.test(message)) {
    const match = message.match(/^i prefer\s+(.+)/i)
    if (match && match[1]) {
      memories.push({
        category: 'preference',
        key: 'General Preference',
        value: match[1].trim(),
        confidence: 0.85,
      })
    }
  }

  // 3. Project Memory detection (Building, working on, project)
  if (/\b(building|working on|developing|creating)\s+(a|an)?\s*([a-zA-Z0-9\s-]+)(\bproject)?/i.test(message)) {
    const match = message.match(/\b(building|working on|developing|creating)\s+(a|an)?\s*([a-zA-Z0-9\s-]+)/i)
    if (match && match[3] && match[3].trim().length > 3) {
      const projectName = match[3].trim()
      memories.push({
        category: 'project',
        key: `Ongoing Project: ${projectName.slice(0, 30)}`,
        value: message.trim(),
        confidence: 0.9,
      })
    }
  }

  // 4. Long-term Facts / Goals
  if (/\bmy goal is\s+(.+)/i.test(message) || /\bi want to (learn|achieve|master)\s+(.+)/i.test(message)) {
    const match = message.match(/\b(my goal is|i want to (learn|achieve|master))\s+(.+)/i)
    if (match) {
      const goalText = match[match.length - 1].trim()
      memories.push({
        category: 'fact',
        key: 'Long-term Goal',
        value: goalText,
        confidence: 0.88,
      })
    }
  }

  return memories
}

/**
 * Scorer: Scores and filters extracted memories for relevance and stability.
 */
export function scoreAndFilterMemories(memories: ExtractedMemory[]): ExtractedMemory[] {
  return memories.filter(m => m.confidence >= 0.7 && m.key.trim().length > 0 && m.value.trim().length > 0)
}
