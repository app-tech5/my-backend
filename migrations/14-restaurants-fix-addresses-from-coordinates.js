/**
 * Aligne address, city et country des restaurants sur leurs coordonnées
 * latitude / longitude existantes (coords inchangées).
 *
 * Les valeurs cibles proviennent d'un reverse geocoding OpenStreetMap (Nominatim).
 */

const { ObjectId } = require('mongodb');

const RESTAURANT_ADDRESS_UPDATES = [
  {
    _id: '695d17d9ed0284bc20edc5b7',
    latitude: '48.8729866',
    longitude: '2.3409458',
    address: '1 Rue Rossini, 75009 Paris',
    city: 'Paris',
    country: 'France',
    previous: {
      address: '13179 W Oak Street, Pine Hills',
      city: 'Pine Hills',
      country: 'United States of America',
    },
  },
  {
    _id: '695d17d9ed0284bc20edc5b8',
    latitude: '48.8656660',
    longitude: '2.3786070',
    address: 'Cité du Figuier, 75011 Paris',
    city: 'Paris',
    country: 'France',
    previous: {
      address: '588 Roman Way, Las Vegas',
      city: 'Las Vegas',
      country: 'Norfolk Island',
    },
  },
  {
    _id: '695d17d9ed0284bc20edc5b9',
    latitude: '48.8644978',
    longitude: '2.3753724',
    address: '82 Avenue Parmentier, 75011 Paris',
    city: 'Paris',
    country: 'France',
    previous: {
      address: '99007 E Cedar Street, Eleazarbury',
      city: 'Eleazarbury',
      country: 'France',
    },
  },
  {
    _id: '695d17d9ed0284bc20edc5ba',
    latitude: '48.8667056',
    longitude: '2.3680178',
    address: 'Avenue de la République, 75011 Paris',
    city: 'Paris',
    country: 'France',
    previous: {
      address: '230 Shayna Highway, Fort Brennaborough',
      city: 'Fort Brennaborough',
      country: 'Cuba',
    },
  },
  {
    _id: '695d17d9ed0284bc20edc5bb',
    latitude: '48.8642245',
    longitude: '2.3376685',
    address: 'Allée Colette, 75001 Paris',
    city: 'Paris',
    country: 'France',
    previous: {
      address: '50959 Telly Hill, Feeneyport',
      city: 'Feeneyport',
      country: 'Cyprus',
    },
  },
  {
    _id: '695d17d9ed0284bc20edc5bc',
    latitude: '48.8714532',
    longitude: '2.3756507',
    address: '108-110 Rue du Faubourg du Temple, 75011 Paris',
    city: 'Paris',
    country: 'France',
    previous: {
      address: '959 Orchard Lane, Randyshire',
      city: 'Randyshire',
      country: 'Iceland',
    },
  },
  {
    _id: '695d17d9ed0284bc20edc5bd',
    latitude: '48.8729306',
    longitude: '2.3798134',
    address: 'Rue Rampal, 75019 Paris',
    city: 'Paris',
    country: 'France',
    previous: {
      address: '6700 S Railroad Street, Lake Lyda',
      city: 'Lake Lyda',
      country: 'Sri Lanka',
    },
  },
  {
    _id: '695d17d9ed0284bc20edc5be',
    latitude: '48.8715899',
    longitude: '2.3487251',
    address: "Rue de l'Échiquier, 75010 Paris",
    city: 'Paris',
    country: 'France',
    previous: {
      address: '290 Bramley Close, Stephanychester',
      city: 'Stephanychester',
      country: 'British Indian Ocean Territory (Chagos Archipelago)',
    },
  },
  {
    _id: '695d17d9ed0284bc20edc5bf',
    latitude: '48.8606245',
    longitude: '2.3674548',
    address: 'Rue Saint-Sébastien, 75011 Paris',
    city: 'Paris',
    country: 'France',
    previous: {
      address: '6402 Shields Roads, Osinskiville',
      city: 'Osinskiville',
      country: 'Bhutan',
    },
  },
  {
    _id: '695d17d9ed0284bc20edc5c0',
    latitude: '48.8637215',
    longitude: '2.3202810',
    address: 'Quai des Tuileries, 75001 Paris',
    city: 'Paris',
    country: 'France',
    previous: {
      address: '70173 Abshire Track, Wiegandbury',
      city: 'Wiegandbury',
      country: 'Bulgaria',
    },
  },
  {
    _id: '695d17d9ed0284bc20edc5c1',
    latitude: '48.8583438',
    longitude: '2.3285171',
    address: 'Rue du Bac, 75007 Paris',
    city: 'Paris',
    country: 'France',
    previous: {
      address: '878 Camila Pass, East Greg',
      city: 'East Greg',
      country: 'Malta',
    },
  },
  {
    _id: '695d17d9ed0284bc20edc5c2',
    latitude: '48.8601220',
    longitude: '2.3373234',
    address: 'Place du Musée du Louvre, 75001 Paris',
    city: 'Paris',
    country: 'France',
    previous: {
      address: '45821 South Avenue, Port Orlo',
      city: 'Port Orlo',
      country: 'Holy See (Vatican City State)',
    },
  },
  {
    _id: '695d17d9ed0284bc20edc5c3',
    latitude: '48.8671455',
    longitude: '2.3330315',
    address: '33 Rue de la Sourdière, 75001 Paris',
    city: 'Paris',
    country: 'France',
    previous: {
      address: '81109 Kutch Extension, Cummeratafield',
      city: 'Cummeratafield',
      country: 'Saint Vincent and the Grenadines',
    },
  },
  {
    _id: '695d17d9ed0284bc20edc5c4',
    latitude: '48.8632096',
    longitude: '2.3298966',
    address: 'Allée de Castiglione, 75001 Paris',
    city: 'Paris',
    country: 'France',
    previous: {
      address: '4639 Ludie Fall, Bruenchester',
      city: 'Bruenchester',
      country: 'Turkey',
    },
  },
  {
    _id: '695d17d9ed0284bc20edc5c5',
    latitude: '48.8734357',
    longitude: '2.3722429',
    address: '13 Passage Hébrard, 75010 Paris',
    city: 'Paris',
    country: 'France',
    previous: {
      address: '4212 Lacy Lane, Fort Clemens',
      city: 'Fort Clemens',
      country: 'Malta',
    },
  },
  {
    _id: '695d17d9ed0284bc20edc5c6',
    latitude: '48.8704125',
    longitude: '2.3316108',
    address: 'Boulevard des Capucines, 75009 Paris',
    city: 'Paris',
    country: 'France',
    previous: {
      address: '6444 Jany Points, Port Cyrus',
      city: 'Port Cyrus',
      country: 'Montserrat',
    },
  },
  {
    _id: '695d17d9ed0284bc20edc5c7',
    latitude: '48.8670920',
    longitude: '2.3314284',
    address: '43 Place du Marché Saint-Honoré, 75001 Paris',
    city: 'Paris',
    country: 'France',
    previous: {
      address: '936 Lemke Avenue, Norbertoburgh',
      city: 'Norbertoburgh',
      country: 'Costa Rica',
    },
  },
  {
    _id: '695d17d9ed0284bc20edc5c8',
    latitude: '48.8699804',
    longitude: '2.3638343',
    address: '1 Rue Dieu, 75010 Paris',
    city: 'Paris',
    country: 'France',
    previous: {
      address: '3229 Laura Lock, Dothan',
      city: 'Dothan',
      country: 'Republic of Korea',
    },
  },
  {
    _id: '695d17d9ed0284bc20edc5c9',
    latitude: '48.8732532',
    longitude: '2.3332616',
    address: "Rue de la Chaussée d'Antin, 75009 Paris",
    city: 'Paris',
    country: 'France',
    previous: {
      address: '493 Estrella Point, Keeblermouth',
      city: 'Keeblermouth',
      country: 'Turkey',
    },
  },
  {
    _id: '695d17d9ed0284bc20edc5ca',
    latitude: '48.8659726',
    longitude: '2.3260300',
    address: '1 Rue Rouget de Lisle, 75001 Paris',
    city: 'Paris',
    country: 'France',
    previous: {
      address: '6509 The Fairway, Harveystead',
      city: 'Harveystead',
      country: 'Cape Verde',
    },
  },
  {
    _id: '6a0bb46f934ef0c94535abae',
    latitude: '4.0822098',
    longitude: '9.6649718',
    address: 'Bonaberi, Douala',
    city: 'Douala',
    country: 'Cameroun',
    previous: {
      address: 'Bonabéri',
      city: 'Douala',
      country: 'Cameroun',
    },
  },
  {
    _id: '6a1b6cb22f505c1e406e3e88',
    latitude: '48.8391964',
    longitude: '2.382849',
    address: 'Gare de Bercy, 75012 Paris',
    city: 'Paris',
    country: 'France',
    previous: {
      address: 'Bercy',
      city: 'Paris',
      country: 'France',
    },
  },
];

async function applyRestaurantLocationUpdates(db, updates, getValues) {
  const restaurantsCol = db.collection('restaurants');

  for (const update of updates) {
    const values = getValues(update);
    const result = await restaurantsCol.updateOne(
      {
        _id: new ObjectId(update._id),
        latitude: update.latitude,
        longitude: update.longitude,
      },
      {
        $set: {
          address: values.address,
          city: values.city,
          country: values.country,
        },
      }
    );

    if (result.matchedCount === 0) {
      console.warn(
        `⚠️ Restaurant ${update._id} ignoré: coordonnées absentes ou modifiées`
      );
    }
  }
}

module.exports = {
  RESTAURANT_ADDRESS_UPDATES,

  async up(db) {
    await applyRestaurantLocationUpdates(db, RESTAURANT_ADDRESS_UPDATES, (update) => ({
      address: update.address,
      city: update.city,
      country: update.country,
    }));
  },

  async down(db) {
    await applyRestaurantLocationUpdates(
      db,
      RESTAURANT_ADDRESS_UPDATES,
      (update) => update.previous
    );
  },
};
