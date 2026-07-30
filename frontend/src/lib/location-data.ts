export interface County {
  name: string
  towns: string[]
}

export interface PickupStation {
  id: number
  county: string
  town: string
  name: string
  fee: number
}

export const KENYAN_COUNTIES: County[] = [
  {
    name: 'Mombasa',
    towns: ['Mvita / CBD', 'Nyali', 'Changamwe', 'Jomvu', 'Kisauni', 'Likoni']
  },
  {
    name: 'Kwale',
    towns: ['Kwale Town', 'Ukunda', 'Diani', 'Msambweni', 'Lunga Lunga', 'Kinango']
  },
  {
    name: 'Kilifi',
    towns: ['Malindi', 'Kilifi Town', 'Mtwapa', 'Vipingo', 'Watamu', 'Mariakani', 'Kaloleni']
  },
  {
    name: 'Tana River',
    towns: ['Hola', 'Garsen', 'Bura', 'Madogo']
  },
  {
    name: 'Lamu',
    towns: ['Lamu Town', 'Mpeketoni', 'Faza', 'Kiunga']
  },
  {
    name: 'Taita Taveta',
    towns: ['Voi', 'Taveta', 'Wundanyi', 'Mwatate']
  },
  {
    name: 'Garissa',
    towns: ['Garissa Town', 'Dadaab', 'Masalani', 'Modogashe']
  },
  {
    name: 'Wajir',
    towns: ['Wajir Town', 'Habaswein', 'Buna', 'Eldas', 'Tarbaj']
  },
  {
    name: 'Mandera',
    towns: ['Mandera Town', 'Elwak', 'Rhamu', 'Takaba', 'Banisa']
  },
  {
    name: 'Marsabit',
    towns: ['Marsabit Town', 'Moyale', 'Laisamis', 'North Horr']
  },
  {
    name: 'Isiolo',
    towns: ['Isiolo Town', 'Garbatulla', 'Merti', 'Oldonyiro']
  },
  {
    name: 'Meru',
    towns: ['Meru Town', 'Maua', 'Nanyuki Border', 'Timau', 'Nkubu', 'Mikinduri']
  },
  {
    name: 'Tharaka-Nithi',
    towns: ['Chuka', 'Kathwana', 'Chogoria', 'Marimanti']
  },
  {
    name: 'Embu',
    towns: ['Embu Town', 'Runyenjes', 'Siakago', 'Ishiara', 'Kiritiri']
  },
  {
    name: 'Kitui',
    towns: ['Kitui Town', 'Mwingi', 'Mutomo', 'Kabati', 'Kwa Vonza']
  },
  {
    name: 'Machakos',
    towns: ['Syokimau', 'Athi River', 'Machakos Town', 'Mlolongo', 'Tala', 'Kangundo', 'Matuu']
  },
  {
    name: 'Makueni',
    towns: ['Wote', 'Sultan Hamud', 'Emali', 'Kibwezi', 'Mtito Andei']
  },
  {
    name: 'Nyandarua',
    towns: ['Ol Kalou', 'Mai Mahiu Border', 'Njabini', 'Engineer', 'Ndaragwa']
  },
  {
    name: 'Nyeri',
    towns: ['Nyeri Town', 'Karatina', 'Othaya', 'Mukurweini', 'Mweiga']
  },
  {
    name: 'Kirinyaga',
    towns: ['Kerugoya', 'Kutus', 'Sagana', "Wang'uru", 'Baricho']
  },
  {
    name: "Murang'a",
    towns: ["Murang'a Town", 'Thika North', 'Kenol', 'Kangema', 'Maragua', 'Gatanga']
  },
  {
    name: 'Kiambu',
    towns: ['Githunguri', 'Juja', 'Kabete', 'Kiambaa', 'Kiambu Town', 'Kikuyu', 'Lari', 'Limuru', 'Ruiru', 'Thika Town']
  },
  {
    name: 'Turkana',
    towns: ['Lodwar', 'Kakuma', 'Lokichogio', 'Lokichar']
  },
  {
    name: 'West Pokot',
    towns: ['Kapenguria', 'Makutano', 'Chepareria', 'Sigor']
  },
  {
    name: 'Samburu',
    towns: ['Maralal', 'Baragoi', 'Archers Post', 'Wamba']
  },
  {
    name: 'Trans Nzoia',
    towns: ['Kitale', 'Kiminini', 'Endebess', 'Saboti']
  },
  {
    name: 'Uasin Gishu',
    towns: ['Eldoret CBD', 'Pioneer', 'Elgon View', 'Huruma', 'Kapsoya', 'Kesses', 'Burnt Forest']
  },
  {
    name: 'Elgeyo Marakwet',
    towns: ['Iten', 'Tambach', 'Kapsowar', 'Chepkorio']
  },
  {
    name: 'Nandi',
    towns: ['Kapsabet', 'Nandi Hills', 'Mosoriot', 'Kilibwoni']
  },
  {
    name: 'Baringo',
    towns: ['Kabarnet', 'Eldama Ravine', 'Marigat', 'Mogotio']
  },
  {
    name: 'Laikipia',
    towns: ['Nanyuki', 'Nyahururu', 'Rumuruti', 'Kinamba']
  },
  {
    name: 'Nakuru',
    towns: ['Nakuru Town East', 'Nakuru Town West', 'Naivasha', 'Gilgil', 'Molo', 'Njoro', 'Rongai', 'Subukia', 'Kuresoi North', 'Kuresoi South', 'Bahati']
  },
  {
    name: 'Narok',
    towns: ['Narok Town', 'Kilgoris', "Ololulung'a", 'Mai Mahiu Border']
  },
  {
    name: 'Kajiado',
    towns: ['Ongata Rongai', 'Kitengela', 'Ngong', 'Kajiado Town', 'Isinya', 'Loitokitok']
  },
  {
    name: 'Kericho',
    towns: ['Kericho Town', 'Litein', 'Kipkelion', 'Londiani']
  },
  {
    name: 'Bomet',
    towns: ['Bomet Town', 'Sotik', 'Mulot', 'Silibwet']
  },
  {
    name: 'Kakamega',
    towns: ['Kakamega Town', 'Mumias', 'Lugari', 'Malava', 'Butere']
  },
  {
    name: 'Vihiga',
    towns: ['Mbale', 'Chavakali', 'Luanda', 'Hamisi']
  },
  {
    name: 'Bungoma',
    towns: ['Bungoma Town', 'Webuye', 'Chwele', 'Kimilili', 'Sirisia']
  },
  {
    name: 'Busia',
    towns: ['Busia Town', 'Malaba', 'Nambale', 'Port Victoria', 'Funyula']
  },
  {
    name: 'Siaya',
    towns: ['Siaya Town', 'Bondo', 'Ugunja', 'Usenge', 'Yala']
  },
  {
    name: 'Kisumu',
    towns: ['Kisumu Central', 'Kisumu East', 'Kisumu West', 'Muhoroni', 'Nyando', 'Nyakach', 'Seme']
  },
  {
    name: 'Homa Bay',
    towns: ['Homa Bay Town', 'Oyugis', 'Mbita', 'Kendul Bay', 'Ndhiwa']
  },
  {
    name: 'Migori',
    towns: ['Migori Town', 'Rongo', 'Awendo', 'Isebania', 'Kehancha']
  },
  {
    name: 'Kisii',
    towns: ['Kisii Town', 'Ogembo', 'Suneka', 'Keroka']
  },
  {
    name: 'Nyamira',
    towns: ['Nyamira Town', 'Nyamaiya', 'Keroka', 'Nyabite']
  },
  {
    name: 'Nairobi',
    towns: [
      'Westlands', 'Dagoretti North', 'Dagoretti South', 'Langata', 'Kibra',
      'Roysambu', 'Kasarani', 'Ruaraka', 'Embakasi South', 'Embakasi North',
      'Embakasi Central', 'Embakasi East', 'Embakasi West', 'Makadara',
      'Kamukunji', 'Starehe', 'Mathare'
    ]
  }
]

export const PICKUP_STATIONS: PickupStation[] = [
  // ---------------------------------------------------------------------------
  // 1. NAIROBI COUNTY (All 17 Constituencies)
  // ---------------------------------------------------------------------------
  { id: 101, county: 'Nairobi', town: 'Starehe', name: 'Starehe Hub - Kimathi House, 1st Floor (CBD)', fee: 100 },
  { id: 102, county: 'Nairobi', town: 'Westlands', name: 'Westlands Hub - Sarit Centre Lower Ground', fee: 100 },
  { id: 103, county: 'Nairobi', town: 'Dagoretti North', name: 'Dagoretti North Hub - Yaya Centre Mall (Kilimani)', fee: 100 },
  { id: 104, county: 'Nairobi', town: 'Dagoretti South', name: 'Dagoretti South Hub - Riruta Shopping Centre', fee: 100 },
  { id: 105, county: 'Nairobi', town: 'Langata', name: 'Langata Hub - Galleria Mall, Ground Floor', fee: 100 },
  { id: 106, county: 'Nairobi', town: 'Kibra', name: 'Kibra Hub - Olympic Plaza, Kibera Drive', fee: 100 },
  { id: 107, county: 'Nairobi', town: 'Roysambu', name: 'Roysambu Hub - TRM (Thika Road Mall) Basement', fee: 100 },
  { id: 108, county: 'Nairobi', town: 'Kasarani', name: 'Kasarani Hub - Seasons Mall Plaza', fee: 100 },
  { id: 109, county: 'Nairobi', town: 'Ruaraka', name: 'Ruaraka Hub - Garden City Mall Express Station', fee: 100 },
  { id: 110, county: 'Nairobi', town: 'Embakasi South', name: 'Embakasi South Hub - Imara Daima Station (Cabanas Stage)', fee: 100 },
  { id: 111, county: 'Nairobi', town: 'Embakasi North', name: 'Embakasi North Hub - Dandora Phase 2 Complex', fee: 100 },
  { id: 112, county: 'Nairobi', town: 'Embakasi Central', name: 'Embakasi Central Hub - Kayole Spine Road Plaza', fee: 100 },
  { id: 113, county: 'Nairobi', town: 'Embakasi East', name: 'Embakasi East Hub - Donholm Greenspan Mall', fee: 100 },
  { id: 114, county: 'Nairobi', town: 'Embakasi West', name: 'Embakasi West Hub - Umoja 1 Cargo Centre', fee: 100 },
  { id: 115, county: 'Nairobi', town: 'Makadara', name: 'Makadara Hub - Buruburu Shopping Centre Phase 4', fee: 100 },
  { id: 116, county: 'Nairobi', town: 'Kamukunji', name: 'Kamukunji Hub - Eastleigh Eastgate Mall', fee: 100 },
  { id: 117, county: 'Nairobi', town: 'Mathare', name: 'Mathare Hub - Juja Road Shopping Complex', fee: 100 },

  // ---------------------------------------------------------------------------
  // 2. KIAMBU COUNTY (All 12 Constituencies)
  // ---------------------------------------------------------------------------
  { id: 201, county: 'Kiambu', town: 'Thika Town', name: 'Thika Station - Ananas Mall, Ground Floor', fee: 120 },
  { id: 202, county: 'Kiambu', town: 'Ruiru', name: 'Ruiru Station - Rainbow Resort Complex', fee: 120 },
  { id: 203, county: 'Kiambu', town: 'Juja', name: 'Juja Station - Juja City Mall', fee: 120 },
  { id: 204, county: 'Kiambu', town: 'Kiambu Town', name: 'Kiambu Station - Kiambu Mall Ground Floor', fee: 120 },
  { id: 205, county: 'Kiambu', town: 'Kiambaa', name: 'Kiambaa Station - Karuri Town Plaza', fee: 120 },
  { id: 206, county: 'Kiambu', town: 'Kabete', name: 'Kabete Station - Uthiru Shopping Centre', fee: 110 },
  { id: 207, county: 'Kiambu', town: 'Kikuyu', name: 'Kikuyu Station - Kikuyu Town Hub Plaza', fee: 110 },
  { id: 208, county: 'Kiambu', town: 'Limuru', name: 'Limuru Station - Limuru Bus Park Arcade', fee: 130 },
  { id: 209, county: 'Kiambu', town: 'Lari', name: 'Lari Station - Uplands Centre', fee: 140 },
  { id: 210, county: 'Kiambu', town: 'Githunguri', name: 'Githunguri Station - Githunguri Dairy Complex', fee: 130 },
  { id: 211, county: 'Kiambu', town: 'Gatundu South', name: 'Gatundu South Station - Gatundu Town Plaza', fee: 140 },
  { id: 212, county: 'Kiambu', town: 'Gatundu North', name: 'Gatundu North Station - Kamwangi Market Centre', fee: 140 },

  // ---------------------------------------------------------------------------
  // 3. MOMBASA COUNTY (All 6 Constituencies)
  // ---------------------------------------------------------------------------
  { id: 301, county: 'Mombasa', town: 'Mvita / CBD', name: 'Mvita Station - Digo Road Arcade (Mombasa CBD)', fee: 150 },
  { id: 302, county: 'Mombasa', town: 'Nyali', name: 'Nyali Station - City Mall Ground Floor', fee: 150 },
  { id: 303, county: 'Mombasa', town: 'Kisauni', name: 'Kisauni Station - Bamburi Mtamboni Complex', fee: 150 },
  { id: 304, county: 'Mombasa', town: 'Changamwe', name: 'Changamwe Station - Magongo Road Plaza', fee: 150 },
  { id: 305, county: 'Mombasa', town: 'Jomvu', name: 'Jomvu Station - Mikindani Junction Centre', fee: 150 },
  { id: 306, county: 'Mombasa', town: 'Likoni', name: 'Likoni Station - Likoni Ferry Arcade', fee: 160 },

  // ---------------------------------------------------------------------------
  // 4. NAKURU COUNTY (All 11 Constituencies)
  // ---------------------------------------------------------------------------
  { id: 401, county: 'Nakuru', town: 'Nakuru Town East', name: 'Nakuru East Station - Westside Mall (Nakuru CBD)', fee: 130 },
  { id: 402, county: 'Nakuru', town: 'Nakuru Town West', name: 'Nakuru West Station - Kaptembwa Centre', fee: 130 },
  { id: 403, county: 'Nakuru', town: 'Naivasha', name: 'Naivasha Station - Naivasha Buffalo Mall', fee: 120 },
  { id: 404, county: 'Nakuru', town: 'Gilgil', name: 'Gilgil Station - Gilgil Bus Park Complex', fee: 130 },
  { id: 405, county: 'Nakuru', town: 'Bahati', name: 'Bahati Station - Maili Tisa Centre', fee: 140 },
  { id: 406, county: 'Nakuru', town: 'Subukia', name: 'Subukia Station - Subukia Town Hub', fee: 150 },
  { id: 407, county: 'Nakuru', town: 'Rongai', name: 'Rongai Station - Salgaa Junction Plaza', fee: 140 },
  { id: 408, county: 'Nakuru', town: 'Njoro', name: 'Njoro Station - Njoro Town Square (Egerton)', fee: 140 },
  { id: 409, county: 'Nakuru', town: 'Molo', name: 'Molo Station - Molo Town Complex', fee: 150 },
  { id: 410, county: 'Nakuru', town: 'Kuresoi North', name: 'Kuresoi North Station - Sirikwa Plaza', fee: 160 },
  { id: 411, county: 'Nakuru', town: 'Kuresoi South', name: 'Kuresoi South Station - Olenguruone Centre', fee: 160 },

  // ---------------------------------------------------------------------------
  // 5. KISUMU COUNTY (All 7 Constituencies)
  // ---------------------------------------------------------------------------
  { id: 501, county: 'Kisumu', town: 'Kisumu Central', name: 'Kisumu Central Station - Mega City Mall', fee: 150 },
  { id: 502, county: 'Kisumu', town: 'Kisumu East', name: 'Kisumu East Station - Nyamasaria Junction Plaza', fee: 150 },
  { id: 503, county: 'Kisumu', town: 'Kisumu West', name: 'Kisumu West Station - Maseno University Hub', fee: 150 },
  { id: 504, county: 'Kisumu', town: 'Muhoroni', name: 'Muhoroni Station - Muhoroni Town Centre', fee: 170 },
  { id: 505, county: 'Kisumu', town: 'Nyando', name: 'Nyando Station - Ahero Bus Park Arcade', fee: 160 },
  { id: 506, county: 'Kisumu', town: 'Nyakach', name: 'Nyakach Station - Pap Onditi Hub', fee: 170 },
  { id: 507, county: 'Kisumu', town: 'Seme', name: 'Seme Station - Kombewa Market Complex', fee: 170 },

  // ---------------------------------------------------------------------------
  // OTHER COUNTIES
  // ---------------------------------------------------------------------------
  { id: 601, county: 'Kwale', town: 'Ukunda', name: 'Ukunda Station - Diani Shopping Centre', fee: 200 },
  { id: 602, county: 'Kilifi', town: 'Malindi', name: 'Malindi Station - Oasis Mall', fee: 180 },
  { id: 603, county: 'Kilifi', town: 'Mtwapa', name: 'Mtwapa Station - Tuskys Mall Building', fee: 160 },
  { id: 604, county: 'Tana River', town: 'Hola', name: 'Hola Station - Hola Town Centre', fee: 300 },
  { id: 605, county: 'Lamu', town: 'Lamu Town', name: 'Lamu Island Station - Seafront Office', fee: 350 },
  { id: 606, county: 'Taita Taveta', town: 'Voi', name: 'Voi Station - Voi Bus Park Complex', fee: 180 },
  { id: 607, county: 'Garissa', town: 'Garissa Town', name: 'Garissa Station - Posta Road Plaza', fee: 250 },
  { id: 608, county: 'Wajir', town: 'Wajir Town', name: 'Wajir Station - Airport Road Arcade', fee: 350 },
  { id: 609, county: 'Mandera', town: 'Mandera Town', name: 'Mandera Station - Mandera Town Hub', fee: 350 },
  { id: 610, county: 'Marsabit', town: 'Marsabit Town', name: 'Marsabit Station - Marsabit Plaza', fee: 300 },
  { id: 611, county: 'Isiolo', town: 'Isiolo Town', name: 'Isiolo Station - Isiolo Commercial Centre', fee: 200 },
  { id: 612, county: 'Meru', town: 'Meru Town', name: 'Meru Station - Nakumatt Building, Tom Mboya St', fee: 150 },
  { id: 613, county: 'Tharaka-Nithi', town: 'Chuka', name: 'Chuka Station - Chuka Plaza', fee: 160 },
  { id: 614, county: 'Embu', town: 'Embu Town', name: 'Embu Station - Embu Highway Mall', fee: 140 },
  { id: 615, county: 'Kitui', town: 'Kitui Town', name: 'Kitui Station - Kitui Town Centre', fee: 160 },
  { id: 616, county: 'Machakos', town: 'Syokimau', name: 'Syokimau Station - Gateway Mall', fee: 110 },
  { id: 617, county: 'Machakos', town: 'Machakos Town', name: 'Machakos Station - Machakos Plaza', fee: 130 },
  { id: 618, county: 'Makueni', town: 'Wote', name: 'Wote Station - Wote Bus Park Building', fee: 160 },
  { id: 619, county: 'Nyandarua', town: 'Ol Kalou', name: 'Ol Kalou Station - County Mall', fee: 150 },
  { id: 620, county: 'Nyeri', town: 'Nyeri Town', name: 'Nyeri Station - Lower Bus Park Complex', fee: 140 },
  { id: 621, county: 'Kirinyaga', town: 'Kerugoya', name: 'Kerugoya Station - Kerugoya Plaza', fee: 140 },
  { id: 622, county: "Murang'a", town: "Murang'a Town", name: "Murang'a Station - Uhuru Street Plaza", fee: 130 },
  { id: 623, county: 'Turkana', town: 'Lodwar', name: 'Lodwar Station - Lodwar Town Centre', fee: 350 },
  { id: 624, county: 'West Pokot', town: 'Kapenguria', name: 'Kapenguria Station - Makutano Hub', fee: 220 },
  { id: 625, county: 'Samburu', town: 'Maralal', name: 'Maralal Station - Maralal Safari Plaza', fee: 280 },
  { id: 626, county: 'Trans Nzoia', town: 'Kitale', name: 'Kitale Station - Kitale Mega Mall', fee: 160 },
  { id: 627, county: 'Uasin Gishu', town: 'Eldoret CBD', name: "Eldoret Station - Rupa's Mall", fee: 140 },
  { id: 628, county: 'Elgeyo Marakwet', town: 'Iten', name: 'Iten Station - Iten Highview Centre', fee: 180 },
  { id: 629, county: 'Nandi', town: 'Kapsabet', name: 'Kapsabet Station - Kapsabet Town Arcade', fee: 160 },
  { id: 630, county: 'Baringo', town: 'Kabarnet', name: 'Kabarnet Station - Kabarnet Plaza', fee: 180 },
  { id: 631, county: 'Laikipia', town: 'Nanyuki', name: 'Nanyuki Station - Nanyuki Mall', fee: 150 },
  { id: 632, county: 'Narok', town: 'Narok Town', name: 'Narok Station - Narok Town Hub', fee: 150 },
  { id: 633, county: 'Kajiado', town: 'Kitengela', name: 'Kitengela Station - Chuna Complex', fee: 120 },
  { id: 634, county: 'Kajiado', town: 'Ongata Rongai', name: 'Rongai Station - Maasai Mall', fee: 110 },
  { id: 635, county: 'Kericho', town: 'Kericho Town', name: 'Kericho Station - Green Square Mall', fee: 150 },
  { id: 636, county: 'Bomet', town: 'Bomet Town', name: 'Bomet Station - Bomet Commercial Centre', fee: 160 },
  { id: 637, county: 'Kakamega', town: 'Kakamega Town', name: 'Kakamega Station - Canon Awori Street', fee: 160 },
  { id: 638, county: 'Vihiga', town: 'Mbale', name: 'Mbale Station - Mbale Highway Building', fee: 160 },
  { id: 639, county: 'Bungoma', town: 'Bungoma Town', name: 'Bungoma Station - Christ the King Plaza', fee: 170 },
  { id: 640, county: 'Busia', town: 'Busia Town', name: 'Busia Station - Busia Border Complex', fee: 180 },
  { id: 641, county: 'Siaya', town: 'Siaya Town', name: 'Siaya Station - Siaya Town Arcade', fee: 170 },
  { id: 642, county: 'Homa Bay', town: 'Homa Bay Town', name: 'Homa Bay Station - Pier Plaza', fee: 180 },
  { id: 643, county: 'Migori', town: 'Migori Town', name: 'Migori Station - Migori Town Centre', fee: 180 },
  { id: 644, county: 'Kisii', town: 'Kisii Town', name: 'Kisii Station - Naivas Building, Kisii', fee: 160 },
  { id: 645, county: 'Nyamira', town: 'Nyamira Town', name: 'Nyamira Station - Nyamira Town Hub', fee: 170 }
]
