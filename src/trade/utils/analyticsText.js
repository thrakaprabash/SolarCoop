// Component-owned copy; shared locale dictionaries remain unchanged.
const messages = {
  en: {
    signIn: 'Sign in to view your energy activity.',
    loading: 'Loading your energy readings…',
    noRecords: 'No energy readings are available for your account.',
    energyError: 'Energy readings could not be loaded.',
    ledgerError: 'Shared energy could not be loaded.',
    latest: 'Latest reading: {date} (Asia/Colombo).',
    stale: 'No reading for today.',
    future: 'Reading date is in the future.',
    dailyUnavailable: 'Daily consumption insights are unavailable. These readings do not yet support verified daily totals.',
    available: 'Available to share: {amount} kWh, based on your current trade balance.',
    insightsNote: 'Daily averages and trends will appear when supported by your energy data.',
    period: 'Month to date: {start} to {end} (Asia/Colombo)',
    coverage: 'Estimated solar coverage',
    solarUnavailable: 'Solar generation and estimated solar coverage are unavailable until daily energy totals can be verified.',
    sharingNote: 'Shared energy includes only your completed outgoing trades during this period.',
  },
  si: {
    signIn: 'ඔබේ බලශක්ති ක්‍රියාකාරකම් බැලීමට පිවිසෙන්න.',
    loading: 'ඔබේ බලශක්ති කියවීම් පූරණය වෙමින් පවතී…',
    noRecords: 'ඔබේ ගිණුම සඳහා බලශක්ති කියවීම් නොමැත.',
    energyError: 'බලශක්ති කියවීම් පූරණය කළ නොහැකි විය.',
    ledgerError: 'බෙදාගත් බලශක්ති දත්ත පූරණය කළ නොහැකි විය.',
    latest: 'නවතම කියවීම: {date} (Asia/Colombo).',
    stale: 'අද සඳහා කියවීමක් නොමැත.',
    future: 'කියවීමේ දිනය අනාගත දිනයකි.',
    dailyUnavailable: 'දෛනික පරිභෝජන විශ්ලේෂණය ලබාගත නොහැක. මෙම කියවීම් මගින් තහවුරු කළ දෛනික එකතුවක් තවම ලබාගත නොහැක.',
    available: 'වත්මන් වෙළඳ ශේෂය අනුව බෙදාගත හැකි බලශක්තිය: {amount} kWh.',
    insightsNote: 'ඔබේ බලශක්ති දත්ත සහාය දක්වන විට දෛනික සාමාන්‍ය සහ ප්‍රවණතා පෙන්වනු ඇත.',
    period: 'මෙම මාසයේ මේ දක්වා: {start} සිට {end} දක්වා (Asia/Colombo)',
    coverage: 'ඇස්තමේන්තුගත සූර්ය බලශක්ති ආවරණය',
    solarUnavailable: 'දෛනික බලශක්ති එකතුව තහවුරු කරන තෙක් සූර්ය බලශක්ති ජනනය සහ ඇස්තමේන්තුගත සූර්ය ආවරණය ලබාගත නොහැක.',
    sharingNote: 'බෙදාගත් බලශක්තියට ඇතුළත් වන්නේ මෙම කාලය තුළ ඔබ විසින් යවන ලද සම්පූර්ණ කළ වෙළඳ ගනුදෙනු පමණි.',
  },
  ta: {
    signIn: 'உங்கள் ஆற்றல் செயல்பாட்டைப் பார்க்க உள்நுழையவும்.',
    loading: 'உங்கள் ஆற்றல் அளவீடுகள் ஏற்றப்படுகின்றன…',
    noRecords: 'உங்கள் கணக்கிற்கான ஆற்றல் அளவீடுகள் இல்லை.',
    energyError: 'ஆற்றல் அளவீடுகளை ஏற்ற முடியவில்லை.',
    ledgerError: 'பகிரப்பட்ட ஆற்றல் தரவை ஏற்ற முடியவில்லை.',
    latest: 'சமீபத்திய அளவீடு: {date} (Asia/Colombo).',
    stale: 'இன்றைய அளவீடு இல்லை.',
    future: 'அளவீட்டின் தேதி எதிர்காலத்தில் உள்ளது.',
    dailyUnavailable: 'தினசரி நுகர்வு பகுப்பாய்வு கிடைக்கவில்லை. இந்த அளவீடுகளிலிருந்து சரிபார்க்கப்பட்ட தினசரி மொத்தங்களை இன்னும் பெற முடியவில்லை.',
    available: 'தற்போதைய வர்த்தக இருப்பின்படி பகிரக்கூடிய ஆற்றல்: {amount} kWh.',
    insightsNote: 'உங்கள் ஆற்றல் தரவு ஆதரிக்கும் போது தினசரி சராசரிகளும் போக்குகளும் காட்டப்படும்.',
    period: 'இந்த மாதத்தில் இதுவரை: {start} முதல் {end} வரை (Asia/Colombo)',
    coverage: 'மதிப்பிடப்பட்ட சூரிய ஆற்றல் பங்கு',
    solarUnavailable: 'தினசரி ஆற்றல் மொத்தங்கள் சரிபார்க்கப்படும் வரை சூரிய ஆற்றல் உற்பத்தியும் மதிப்பிடப்பட்ட சூரிய ஆற்றல் பங்கும் கிடைக்காது.',
    sharingNote: 'இந்தக் காலத்தில் நீங்கள் அனுப்பிய நிறைவடைந்த வர்த்தகங்களின் ஆற்றல் மட்டுமே பகிரப்பட்ட ஆற்றலில் சேர்க்கப்படும்.',
  },
};

export function analyticsText(language, key, values = {}) {
  const locale = String(language || 'en').toLowerCase().split(/[-_]/)[0];
  const template = messages[locale]?.[key] ?? messages.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (match, name) => values[name] == null ? match : String(values[name]));
}
