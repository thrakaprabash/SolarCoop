// Local guidance until the shared Alerts navigation integration is approved.
const copy = {
  en: 'To report this transaction, open Alerts, select Submit Complaint, and enter the transaction ID shown above.',
  si: 'මෙම ගනුදෙනුව වාර්තා කිරීමට Alerts විවෘත කර Submit Complaint තෝරා ඉහත දැක්වෙන ගනුදෙනු අංකය ඇතුළත් කරන්න.',
  ta: 'இந்தப் பரிவர்த்தனையைப் புகாரளிக்க Alerts திறந்து, Submit Complaint என்பதைத் தேர்ந்தெடுத்து, மேலே உள்ள பரிவர்த்தனை எண்ணை உள்ளிடவும்.',
};
export const reportingHelp = (language = 'en') => copy[language.split('-')[0]] || copy.en;
