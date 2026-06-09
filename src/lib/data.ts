// NL rotating examples
export const nlExamples = [
  "mage amma ta birthday gift ekak one",
  "Need a laptop under 250,000",
  "Looking for flowers for tomorrow",
  "Want something special for my wife",
  "amma ta gift ekak hoyanna",
  "Need a cake for today in Colombo",
  "Gift for my boss under 10,000",
  "mata husband ta anniversary surprise one",
];

// Loading messages
export const loadingMessages = [
  "Understanding your needs...",
  "Looking for meaningful options...",
  "Checking availability...",
  "Finding the strongest matches...",
  "Almost ready...",
];

// Recipients
export const recipients = [
  { id: "mother", emoji: "🌸", label: "Mother", sublabel: "A gift she'll treasure" },
  { id: "father", emoji: "🎩", label: "Father", sublabel: "Something he'll love" },
  { id: "partner", emoji: "💛", label: "Partner", sublabel: "Show them you care" },
  { id: "friend", emoji: "🤝", label: "Friend", sublabel: "Celebrate your bond" },
  { id: "child", emoji: "🌟", label: "Child", sublabel: "Make their day special" },
  { id: "colleague", emoji: "☕", label: "Colleague", sublabel: "Professional & thoughtful" },
  { id: "client", emoji: "🎁", label: "Client", sublabel: "Leave a lasting impression" },
  { id: "teacher", emoji: "📚", label: "Teacher", sublabel: "Show your appreciation" },
];

// Occasions
export const occasions = [
  { id: "birthday", emoji: "🎂", label: "Birthday" },
  { id: "anniversary", emoji: "💍", label: "Anniversary" },
  { id: "graduation", emoji: "🎓", label: "Graduation" },
  { id: "wedding", emoji: "🕊️", label: "Wedding" },
  { id: "housewarming", emoji: "🏡", label: "Housewarming" },
  { id: "thank_you", emoji: "🙏", label: "Thank You" },
  { id: "just_because", emoji: "💛", label: "Just Because" },
  { id: "festival", emoji: "✨", label: "Festival" },
  { id: "new_baby", emoji: "👶", label: "New Baby" },
  { id: "farewell", emoji: "🌿", label: "Farewell" },
];

// Budget options
export const budgetOptions = [
  { id: "under_2500", label: "Under Rs. 2,500", sublabel: "Thoughtful & sweet", min: 0, max: 2500 },
  { id: "under_5k", label: "Under Rs. 5,000", sublabel: "Great everyday gifts", min: 0, max: 5000 },
  { id: "5k_10k", label: "Rs. 5,000 – 10,000", sublabel: "The popular sweet spot", min: 5000, max: 10000 },
  { id: "10k_20k", label: "Rs. 10,000 – 20,000", sublabel: "Premium & memorable", min: 10000, max: 20000 },
  { id: "20k_plus", label: "Rs. 20,000+", sublabel: "A truly special gift", min: 20000, max: null },
];

// Interests / Personas
export const interests = [
  { emoji: "🌱", label: "Loves Gardening" },
  { emoji: "🍳", label: "Loves Cooking" },
  { emoji: "📚", label: "Loves Reading" },
  { emoji: "💻", label: "Loves Technology" },
  { emoji: "🧘", label: "Loves Wellness" },
  { emoji: "✈️", label: "Loves Travel" },
  { emoji: "🎵", label: "Loves Music" },
  { emoji: "🎨", label: "Loves Art" },
  { emoji: "🌿", label: "Loves Nature" },
  { emoji: "☕", label: "Loves Coffee & Tea" },
  { emoji: "🏃", label: "Loves Fitness" },
  { emoji: "🍽️", label: "Loves Food & Dining" },
];

// Delivery options
export const deliveryOptions = [
  { id: "today", emoji: "⚡", label: "Today", sublabel: "Express delivery", available: true },
  { id: "tomorrow", emoji: "📦", label: "Tomorrow", sublabel: "Standard delivery", available: true },
  { id: "this_week", emoji: "📅", label: "This Week", sublabel: "Flexible timing", available: true },
  { id: "flexible", emoji: "🌿", label: "No Rush", sublabel: "We'll find the best option", available: true },
];

// Self categories
export const selfCategories = [
  { id: "electronics", emoji: "📱", label: "Electronics" },
  { id: "flowers", emoji: "🌸", label: "Flowers" },
  { id: "cakes", emoji: "🎂", label: "Cakes & Sweets" },
  { id: "fashion", emoji: "👗", label: "Fashion" },
  { id: "lifestyle", emoji: "✨", label: "Lifestyle" },
  { id: "home", emoji: "🏡", label: "Home & Living" },
  { id: "food", emoji: "🍱", label: "Food & Drinks" },
  { id: "beauty", emoji: "💆", label: "Beauty & Care" },
  { id: "books", emoji: "📚", label: "Books & Stationery" },
];

// Discovery vibes
export const discoveryVibes = [
  { id: "trending", emoji: "🔥", label: "Trending This Week", color: "bg-orange-50 border-orange-100" },
  { id: "most_loved", emoji: "❤️", label: "Most Loved Gifts", color: "bg-rose-50 border-rose-100" },
  { id: "last_minute", emoji: "⚡", label: "Last Minute Heroes", color: "bg-amber-50 border-amber-100" },
  { id: "unique", emoji: "✨", label: "Unique Finds", color: "bg-violet-50 border-violet-100" },
  { id: "luxury", emoji: "💎", label: "Luxury Picks", color: "bg-blue-50 border-blue-100" },
  { id: "under_5k", emoji: "🎯", label: "Under Rs. 5,000", color: "bg-green-50 border-green-100" },
  { id: "handpicked", emoji: "⭐", label: "Staff Picks", color: "bg-yellow-50 border-yellow-100" },
  { id: "hidden_gems", emoji: "🪩", label: "Hidden Gems", color: "bg-teal-50 border-teal-100" },
];

// Placeholder recommendations
export const placeholderRecs = [
  {
    id: "rec-1",
    variant: "best_pick" as const,
    badge: "🏆 My Top Pick",
    title: "Curated just for you",
    priceRange: "Rs. 4,500 – 6,000",
    delivery: "Available tomorrow",
    trustChips: ["Matches Your Budget", "Available For Delivery", "Matches Recipient"],
  },
  {
    id: "rec-2",
    variant: "most_loved" as const,
    badge: "❤️ Most Loved",
    title: "A customer favourite",
    priceRange: "Rs. 3,200 – 4,800",
    delivery: "Available today",
    trustChips: ["Matches Recipient", "Recommended For Occasion"],
  },
  {
    id: "rec-3",
    variant: "unique" as const,
    badge: "✨ Unique Choice",
    title: "Something unexpected",
    priceRange: "Rs. 5,500 – 7,500",
    delivery: "Available this week",
    trustChips: ["Matches Your Budget", "Matches Recipient"],
  },
];
