// Kenyan Counties and Constituencies Data
export const kenyanCounties = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet',
  'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado',
  'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga',
  'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia',
  'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit',
  'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi',
  'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
  'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River',
  'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu',
  'Vihiga', 'Wajir', 'West Pokot'
];

// Sample constituencies (simplified - in production, this would be more comprehensive)
export const constituenciesByCounty: Record<string, string[]> = {
  'Nairobi': ['Westlands', 'Dagoretti North', 'Dagoretti South', 'Langata', 'Kibra', 'Roysambu', 'Kasarani', 'Ruaraka', 'Embakasi South', 'Embakasi North', 'Embakasi Central', 'Embakasi East', 'Embakasi West', 'Makadara', 'Kamukunji', 'Starehe', 'Mathare'],
  'Mombasa': ['Changamwe', 'Jomvu', 'Kisauni', 'Nyali', 'Likoni', 'Mvita'],
  'Kisumu': ['Kisumu East', 'Kisumu West', 'Kisumu Central', 'Seme', 'Nyando', 'Muhoroni'],
  'Nakuru': ['Nakuru Town West', 'Nakuru Town East', 'Kuresoi North', 'Kuresoi South', 'Molo', 'Njoro', 'Naivasha', 'Gilgil', 'Subukia', 'Bahati', 'Rongai'],
  'Meru': ['North Imenti', 'South Imenti', 'Central Imenti', 'Tigania West', 'Tigania East', 'Igembe South', 'Igembe Central', 'Igembe North', 'Buuri'],
  'Kakamega': ['Lurambi', 'Navakholo', 'Mumias West', 'Mumias East', 'Matungu', 'Butere', 'Khwisero', 'Shinyalu', 'Ikolomani', 'Malava', 'Lugari', 'Likuyani'],
  'Uasin Gishu': ['Turbo', 'Ainabkoi', 'Kapseret', 'Kesses', 'Moiben', 'Soy'],
  'Kiambu': ['Gatundu South', 'Gatundu North', 'Juja', 'Thika Town', 'Ruiru', 'Githunguri', 'Kiambu', 'Kiambaa', 'Kabete', 'Kikuyu', 'Limuru', 'Lari'],
  'Machakos': ['Mavoko', 'Machakos Town', 'Mwala', 'Yatta', 'Kangundo', 'Matungulu', 'Kathiani', 'Masinga', 'Mbooni'],
  'Kisii': ['Kitutu Chache North', 'Kitutu Chache South', 'Nyaribari Masaba', 'Nyaribari Chache', 'Bomachoge Borabu', 'Bomachoge Chache', 'Bobasi', 'Bomachoge Borabu', 'Nyamira North', 'Nyamira South'],
  'Turkana': ['Turkana North', 'Turkana West', 'Turkana Central', 'Turkana East', 'Loima', 'Turkana South'],
  'Garissa': ['Garissa Township', 'Balambala', 'Lagdera', 'Dadaab', 'Fafi', 'Ijara'],
  'Wajir': ['Wajir North', 'Wajir East', 'Wajir South', 'Wajir West', 'Eldas', 'Tarbaj'],
  'Mandera': ['Mandera West', 'Mandera North', 'Mandera Central', 'Mandera East', 'Lafey', 'Banissa'],
  'Marsabit': ['Saku', 'Laisamis', 'North Horr', 'Moyale'],
  'Isiolo': ['Isiolo North', 'Isiolo South'],
  'Tharaka-Nithi': ['Tharaka', 'Chuka/Igambang\'ombe', 'Maara'],
  'Embu': ['Manyatta', 'Runyenjes', 'Mbeere North', 'Mbeere South'],
  'Kitui': ['Mwingi North', 'Mwingi West', 'Mwingi Central', 'Kitui West', 'Kitui Rural', 'Kitui Central', 'Kitui East', 'Kitui South'],
  'Makueni': ['Kilome', 'Kibwezi West', 'Kibwezi East', 'Makueni', 'Mbooni'],
  'Nyandarua': ['Kinangop', 'Kipipiri', 'Ol Kalou', 'Ol Jorok', 'Ndaragwa'],
  'Nyeri': ['Tetu', 'Kieni', 'Mathira', 'Othaya', 'Mukurweini', 'Nyeri Town'],
  'Kirinyaga': ['Mwea', 'Gichugu', 'Ndia', 'Kirinyaga Central'],
  'Murang\'a': ['Kangema', 'Mathioya', 'Kiharu', 'Kigumo', 'Maragwa', 'Kandara', 'Gatanga'],
  'West Pokot': ['Kapenguria', 'Sigor', 'Kacheliba', 'Pokot South'],
  'Samburu': ['Samburu North', 'Samburu East', 'Samburu West'],
  'Trans Nzoia': ['Saboti', 'Kiminini', 'Cherangany', 'Kwanza', 'Endebess'],
  'Elgeyo-Marakwet': ['Keiyo North', 'Keiyo South', 'Marakwet East', 'Marakwet West'],
  'Nandi': ['Chesumei', 'Emgwen', 'Mosop', 'Tinderet', 'Aldai', 'Nandi Hills'],
  'Baringo': ['Tiaty', 'Baringo North', 'Baringo Central', 'Baringo South', 'Mogotio', 'Eldama Ravine'],
  'Laikipia': ['Laikipia West', 'Laikipia East', 'Laikipia North'],
  'Narok': ['Narok North', 'Narok East', 'Narok South', 'Narok West', 'Kilgoris', 'Emurua Dikirr'],
  'Kajiado': ['Kajiado North', 'Kajiado Central', 'Kajiado East', 'Kajiado West', 'Kajiado South'],
  'Kericho': ['Ainamoi', 'Belgut', 'Bureti', 'Kipkelion East', 'Kipkelion West', 'Sigowet-Soin'],
  'Bomet': ['Bomet Central', 'Bomet East', 'Chepalungu', 'Konoin', 'Sotik'],
  'Vihiga': ['Emuhaya', 'Hamisi', 'Luanda', 'Sabatia', 'Vihiga'],
  'Bungoma': ['Bumula', 'Kabuchai', 'Kanduyi', 'Kimilili', 'Mt. Elgon', 'Sirisia', 'Tongaren', 'Webuye East', 'Webuye West'],
  'Busia': ['Budalangi', 'Butula', 'Funyula', 'Nambale', 'Teso North', 'Teso South'],
  'Siaya': ['Alego Usonga', 'Bondo', 'Gem', 'Rarieda', 'Ugenya', 'Ugunja'],
  'Homa Bay': ['Homa Bay Town', 'Kabondo Kasipul', 'Karachuonyo', 'Kasipul', 'Mbita', 'Ndhiwa', 'Rangwe', 'Suba North', 'Suba South'],
  'Migori': ['Awendo', 'Kuria East', 'Kuria West', 'Nyatike', 'Rongo', 'Suna East', 'Suna West', 'Uriri'],
  'Nyamira': ['Borabu', 'Kitutu Masaba', 'North Mugirango', 'West Mugirango'],
  'Kilifi': ['Ganze', 'Kaloleni', 'Kilifi North', 'Kilifi South', 'Magarini', 'Malindi', 'Rabai'],
  'Kwale': ['Kinango', 'Lunga Lunga', 'Matuga', 'Msambweni'],
  'Lamu': ['Lamu East', 'Lamu West'],
  'Tana River': ['Bura', 'Galole', 'Garsen'],
  'Taita-Taveta': ['Mwatate', 'Taveta', 'Voi', 'Wundanyi'],
};

// Helper function to get constituencies for a county
export const getConstituencies = (county: string): string[] => {
  return constituenciesByCounty[county] || [];
};

