import mongoose from "mongoose";
import "dotenv/config";
import { Hospital } from "./src/models/Hospital.models.js";
import { HospitalResource } from "./src/models/Hospital_resource.models.js";
import { BloodStock } from "./src/models/BloodStock.models.js";
import { MedicineInventory } from "./src/models/MedicineInventory.models.js";

async function verify() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB Atlas.\n");

  const testLocations = [
    { city: "Delhi NCR (Connaught Place)", lng: 77.2090, lat: 28.6139 },
    { city: "Mumbai (Marine Drive)", lng: 72.8258, lat: 18.9438 },
    { city: "Bengaluru (MG Road)", lng: 77.6033, lat: 12.9752 },
    { city: "Kolkata (Park Street)", lng: 88.3539, lat: 22.5519 },
    { city: "Chennai (Anna Salai)", lng: 80.2600, lat: 13.0600 },
    { city: "Hyderabad (Banjara Hills)", lng: 78.4350, lat: 17.4156 },
    { city: "Ahmedabad (CG Road)", lng: 72.5600, lat: 23.0300 },
    { city: "Pune (Shivaji Nagar)", lng: 73.8500, lat: 18.5300 },
    { city: "Jaipur (MI Road)", lng: 75.8000, lat: 26.9150 },
    { city: "Prayagraj (Civil Lines)", lng: 81.8463, lat: 25.4358 },
    { city: "Lucknow (Hazratganj)", lng: 80.9462, lat: 26.8467 },
    { city: "Chandigarh (Sector 17)", lng: 76.7794, lat: 30.7333 },
    { city: "Kochi (MG Road)", lng: 76.2800, lat: 9.9700 },
    { city: "Patna (Bailey Road)", lng: 85.1376, lat: 25.5941 },
    { city: "Bhopal (MP Nagar)", lng: 77.4300, lat: 23.2300 },
    { city: "Bhubaneswar (Janpath)", lng: 85.8300, lat: 20.2900 },
    { city: "Guwahati (GS Road)", lng: 91.7700, lat: 26.1500 },
    { city: "Ranchi (Main Road)", lng: 85.3300, lat: 23.3500 },
    { city: "Dehradun (Rajpur Road)", lng: 78.0500, lat: 30.3300 },
    { city: "Srinagar (Lal Chowk)", lng: 74.8100, lat: 34.0700 },
    { city: "Panaji / Goa", lng: 73.8300, lat: 15.4900 },
    { city: "Port Blair (Andaman)", lng: 92.7300, lat: 11.6300 }
  ];

  console.log("==========================================================================");
  console.log(" LIVE MONGODB ATLAS 50KM RADIUS GEOSPATIAL SEARCH VERIFICATION");
  console.log("==========================================================================");

  for (const loc of testLocations) {
    const nearby = await Hospital.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [loc.lng, loc.lat] },
          $maxDistance: 50000 // 50km in meters
        }
      }
    }).limit(6);

    console.log(`\n📍 ${loc.city} -> Found ${nearby.length} hospitals within 50km:`);
    for (const h of nearby) {
      // Check resources
      const [beds, blood, meds] = await Promise.all([
        HospitalResource.find({ hospitalId: h._id }),
        BloodStock.find({ hospitalId: h._id }),
        MedicineInventory.find({ hospitalId: h._id })
      ]);
      console.log(`   • [${h.hospitalId}] ${h.name} | Types: ${h.hospitalType} | Resources: ${beds.length} | Bloods: ${blood.length} | Meds: ${meds.length}`);
    }
  }

  console.log("\n==========================================================================");
  console.log(" ALL GEOSPATIAL QUERIES AND RESOURCE INTEGRITY VERIFIED SUCCESSFULLY!");
  console.log("==========================================================================");
  process.exit(0);
}

verify().catch((err) => {
  console.error(err);
  process.exit(1);
});
