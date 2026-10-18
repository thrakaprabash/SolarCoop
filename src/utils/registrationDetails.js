export const DISTRICTS = ['Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'];
export const INVERTER_BRANDS = ['Huawei', 'Sungrow', 'Growatt', 'SMA', 'GoodWe', 'Solis', 'Deye', 'Fronius', 'Other', 'Unknown'];
export const SPECIALIZATIONS = ['solar_installation', 'inverter_repair', 'electrical_maintenance', 'general_solar'];
export const EMPTY_DETAILS = { address: '', district: '', city: '', solarCapacity: '', monthlyConsumption: '', inverterBrand: '', inverterModel: '', inverterCapacity: '', panelCount: '', experienceYears: '', specialization: '', qualification: '' };

export function validateRegistrationDetails(role, values) {
  const errors = {};
  if (!DISTRICTS.includes(values.district)) errors.district = 'districtRequired';
  if (role === 'technician') {
    if (!SPECIALIZATIONS.includes(values.specialization)) errors.specialization = 'specializationRequired';
  } else {
    if (!values.address.trim()) errors.address = 'addressRequired';
    if (!values.city.trim()) errors.city = 'cityRequired';
  }
  const numeric = (key, required, max, integer = false, allowZero = false) => {
    const text = String(values[key] ?? '').trim();
    if (!text && !required) return;
    const value = Number(text);
    if (!text || !Number.isFinite(value) || (allowZero ? value < 0 : value <= 0) || value > max || (integer && !Number.isInteger(value))) errors[key] = 'invalidNumber';
  };
  if (role === 'owner') {
    numeric('solarCapacity', true, 100);
    numeric('inverterCapacity', false, 100);
    numeric('panelCount', false, 200, true);
    if (values.inverterBrand && !INVERTER_BRANDS.includes(values.inverterBrand)) errors.inverterBrand = 'invalidChoice';
  }
  if (role === 'consumer') numeric('monthlyConsumption', false, 100000, false, true);
  if (role === 'technician') numeric('experienceYears', false, 80, true, true);
  for (const [key, max] of [['address', 300], ['city', 100], ['inverterModel', 100], ['qualification', 200]]) {
    if (String(values[key] ?? '').length > max) errors[key] = 'tooLong';
  }
  return errors;
}

// Only send fields belonging to the selected role; switching roles cannot leak
// hidden values into another role's registration.
export function registrationDetailsPayload(role, values) {
  const text = key => String(values[key] ?? '').trim() || null;
  const number = key => text(key) == null ? null : Number(text(key));
  const details = { district: text('district') };
  if (role === 'technician') return { ...details, specialization: text('specialization'), experienceYears: number('experienceYears'), qualification: text('qualification') };
  Object.assign(details, { address: text('address'), city: text('city') });
  if (role === 'consumer') return { ...details, monthlyConsumption: number('monthlyConsumption') };
  return { ...details, solarCapacity: number('solarCapacity'), inverterBrand: text('inverterBrand'), inverterModel: text('inverterModel'), inverterCapacity: number('inverterCapacity'), panelCount: number('panelCount') };
}
