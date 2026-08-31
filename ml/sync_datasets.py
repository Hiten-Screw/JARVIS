import os
import pandas as pd
import numpy as np

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MASTER_PATH = os.path.join(SCRIPT_DIR, "hospital_master.csv")
DIR_PATH = os.path.join(SCRIPT_DIR, "hospital_directory.csv")
TRAIN_PATH = os.path.join(SCRIPT_DIR, "training_data.csv")

PRAYAGRAJ_HOSPITALS = [
    {
        "hospital_id": "HOSP-101",
        "hospital_name": "Prayagraj Central Civil Hospital",
        "address_original_first_line": "45 MG Road, Civil Lines",
        "district": "Prayagraj",
        "state": "Uttar Pradesh",
        "latitude": 25.4358,
        "longitude": 81.8463,
        "telephone": "+91-532-2460123",
        "mobile_number": "+91-532-2460123",
        "specialties": "Emergency, Cardiology, Neurology, General Medicine, Trauma Care, Pulmonology",
        "facilities": "ICU, Emergency, Ventilators, Blood Bank, CT Scan",
        "emergency_services": "yes",
        "emergency_num": "+91-532-2460123",
        "hospital_category": "Government",
        "hospital_care_type": "Tertiary Care",
        "total_num_beds": 250,
        "number_doctor": 45
    },
    {
        "hospital_id": "HOSP-102",
        "hospital_name": "Swaroop Rani Nehru Hospital (SRN)",
        "address_original_first_line": "Chatham Lines, Medical College",
        "district": "Prayagraj",
        "state": "Uttar Pradesh",
        "latitude": 25.4520,
        "longitude": 81.8380,
        "telephone": "+91-532-2256011",
        "mobile_number": "+91-532-2256011",
        "specialties": "Emergency, Trauma Care, Neurology, Cardiology, General Surgery, Nephrology",
        "facilities": "Trauma Center, Emergency, ICU, Blood Bank, Dialysis",
        "emergency_services": "yes",
        "emergency_num": "+91-532-2256011",
        "hospital_category": "Government",
        "hospital_care_type": "Super Specialty",
        "total_num_beds": 350,
        "number_doctor": 65
    },
    {
        "hospital_id": "HOSP-103",
        "hospital_name": "Tej Bahadur Sapru (Beli) Hospital",
        "address_original_first_line": "Stanley Road, Beli",
        "district": "Prayagraj",
        "state": "Uttar Pradesh",
        "latitude": 25.4610,
        "longitude": 81.8540,
        "telephone": "+91-532-2420088",
        "mobile_number": "+91-532-2420088",
        "specialties": "Emergency, General Medicine, Pediatrics, Orthopedics",
        "facilities": "Emergency, General Ward, ICU, Pharmacy",
        "emergency_services": "yes",
        "emergency_num": "+91-532-2420088",
        "hospital_category": "Government",
        "hospital_care_type": "Secondary Care",
        "total_num_beds": 180,
        "number_doctor": 32
    },
    {
        "hospital_id": "HOSP-104",
        "hospital_name": "Kamla Nehru Memorial Hospital (Cancer Centre)",
        "address_original_first_line": "Tagore Town",
        "district": "Prayagraj",
        "state": "Uttar Pradesh",
        "latitude": 25.4480,
        "longitude": 81.8620,
        "telephone": "+91-532-2466661",
        "mobile_number": "+91-532-2466661",
        "specialties": "Oncology, Radiology, Chemotherapy, General Surgery, Nuclear Medicine",
        "facilities": "Cancer Therapy, Chemotherapy, Radiation, ICU, Surgery",
        "emergency_services": "yes",
        "emergency_num": "+91-532-2466661",
        "hospital_category": "Specialized",
        "hospital_care_type": "Regional Cancer Center",
        "total_num_beds": 160,
        "number_doctor": 28
    },
    {
        "hospital_id": "HOSP-105",
        "hospital_name": "Motilal Nehru Divisional Hospital (Colvin)",
        "address_original_first_line": "Katra Road",
        "district": "Prayagraj",
        "state": "Uttar Pradesh",
        "latitude": 25.4550,
        "longitude": 81.8590,
        "telephone": "+91-532-2460300",
        "mobile_number": "+91-532-2460300",
        "specialties": "Emergency, General Medicine, Orthopedics, Cardiology",
        "facilities": "Emergency, Outpatient, Inpatient, X-Ray",
        "emergency_services": "yes",
        "emergency_num": "+91-532-2460300",
        "hospital_category": "Government",
        "hospital_care_type": "Divisional Hospital",
        "total_num_beds": 140,
        "number_doctor": 25
    },
    {
        "hospital_id": "HOSP-106",
        "hospital_name": "Nazareth Hospital",
        "address_original_first_line": "13A Thornhill Road, Civil Lines",
        "district": "Prayagraj",
        "state": "Uttar Pradesh",
        "latitude": 25.4490,
        "longitude": 81.8390,
        "telephone": "+91-532-2407441",
        "mobile_number": "+91-532-2407441",
        "specialties": "Emergency, Cardiology, Gastroenterology, General Medicine, ICU",
        "facilities": "ICU, Emergency, Cath Lab, Pathology",
        "emergency_services": "yes",
        "emergency_num": "+91-532-2407441",
        "hospital_category": "Private",
        "hospital_care_type": "Tertiary Care",
        "total_num_beds": 200,
        "number_doctor": 38
    },
    {
        "hospital_id": "HOSP-107",
        "hospital_name": "United Medicity Super Specialty Hospital",
        "address_original_first_line": "Rawatpur, Near Jhalwa",
        "district": "Prayagraj",
        "state": "Uttar Pradesh",
        "latitude": 25.4310,
        "longitude": 81.7650,
        "telephone": "+91-532-2441122",
        "mobile_number": "+91-532-2441122",
        "specialties": "Emergency, Cardiology, Neurology, Nephrology, Trauma Care",
        "facilities": "Advanced ICU, Cardiac Cath Lab, Dialysis, Ambulance",
        "emergency_services": "yes",
        "emergency_num": "+91-532-2441122",
        "hospital_category": "Private",
        "hospital_care_type": "Super Specialty",
        "total_num_beds": 300,
        "number_doctor": 55
    },
    {
        "hospital_id": "HOSP-108",
        "hospital_name": "Jeevan Jyoti Super Specialty Hospital",
        "address_original_first_line": "Lowther Road, George Town",
        "district": "Prayagraj",
        "state": "Uttar Pradesh",
        "latitude": 25.4390,
        "longitude": 81.8530,
        "telephone": "+91-532-2466000",
        "mobile_number": "+91-532-2466000",
        "specialties": "Cardiology, Emergency, Neurology, Dialysis, General Medicine",
        "facilities": "Cath Lab, Dialysis, Intensive Care, Ambulance",
        "emergency_services": "yes",
        "emergency_num": "+91-532-2466000",
        "hospital_category": "Private",
        "hospital_care_type": "Super Specialty",
        "total_num_beds": 150,
        "number_doctor": 30
    },
    {
        "hospital_id": "HOSP-109",
        "hospital_name": "Asha Hospital & Trauma Centre",
        "address_original_first_line": "Triveni Nagar, Naini",
        "district": "Prayagraj",
        "state": "Uttar Pradesh",
        "latitude": 25.3980,
        "longitude": 81.8650,
        "telephone": "+91-532-2697800",
        "mobile_number": "+91-532-2697800",
        "specialties": "Emergency, Trauma Care, Orthopedics, General Surgery",
        "facilities": "Trauma Unit, Emergency, Operation Theater",
        "emergency_services": "yes",
        "emergency_num": "+91-532-2697800",
        "hospital_category": "Private",
        "hospital_care_type": "Trauma Care",
        "total_num_beds": 110,
        "number_doctor": 22
    },
    {
        "hospital_id": "HOSP-110",
        "hospital_name": "Vatsalya Maternity & Surgical Hospital",
        "address_original_first_line": "GTB Nagar, Kareli",
        "district": "Prayagraj",
        "state": "Uttar Pradesh",
        "latitude": 25.4210,
        "longitude": 81.8250,
        "telephone": "+91-532-2550100",
        "mobile_number": "+91-532-2550100",
        "specialties": "Obstetrics & Gynecology, Pediatrics, Emergency, Neonatology",
        "facilities": "NICU, Maternity Ward, Emergency, Pediatric ICU",
        "emergency_services": "yes",
        "emergency_num": "+91-532-2550100",
        "hospital_category": "Private",
        "hospital_care_type": "Maternity & Pediatric",
        "total_num_beds": 95,
        "number_doctor": 18
    },
    {
        "hospital_id": "HOSP-111",
        "hospital_name": "Phoenix Super Specialty Hospital & Trauma Center",
        "address_original_first_line": "Lukerganj, GT Road",
        "district": "Prayagraj",
        "state": "Uttar Pradesh",
        "latitude": 25.4470,
        "longitude": 81.8150,
        "telephone": "+91-532-2601122",
        "mobile_number": "+91-532-2601122",
        "specialties": "Emergency, Trauma Care, Neurology, Cardiology",
        "facilities": "Emergency, ICU, Neuro Trauma, Pharmacy",
        "emergency_services": "yes",
        "emergency_num": "+91-532-2601122",
        "hospital_category": "Private",
        "hospital_care_type": "Super Specialty",
        "total_num_beds": 130,
        "number_doctor": 26
    },
    {
        "hospital_id": "HOSP-112",
        "hospital_name": "Heritage Multi Specialty Hospital",
        "address_original_first_line": "Teliyarganj, Lucknow Road",
        "district": "Prayagraj",
        "state": "Uttar Pradesh",
        "latitude": 25.4850,
        "longitude": 81.8600,
        "telephone": "+91-532-2544333",
        "mobile_number": "+91-532-2544333",
        "specialties": "Emergency, General Medicine, Orthopedics, Cardiology",
        "facilities": "Emergency, ICU, Diagnostics, Inpatient",
        "emergency_services": "yes",
        "emergency_num": "+91-532-2544333",
        "hospital_category": "Private",
        "hospital_care_type": "Multi Specialty",
        "total_num_beds": 100,
        "number_doctor": 20
    }
]

REGIONAL_UP_CENTERS = [
    { "hospital_id": "HOSP-201", "hospital_name": "BHU Sir Sunderlal Hospital", "address_original_first_line": "BHU Campus", "district": "Varanasi", "state": "Uttar Pradesh", "latitude": 25.2754, "longitude": 82.9995, "telephone": "+91-542-2307500", "mobile_number": "+91-542-2307500", "specialties": "Emergency, Cardiology, Neurology, Trauma Care, Oncology", "facilities": "Super Specialty, Trauma, Blood Bank, Organ Transplant", "emergency_services": "yes", "emergency_num": "+91-542-2307500", "hospital_category": "Government", "hospital_care_type": "Apex Institute", "total_num_beds": 450, "number_doctor": 90 },
    { "hospital_id": "HOSP-202", "hospital_name": "Heritage Hospital Lanka", "address_original_first_line": "Lanka", "district": "Varanasi", "state": "Uttar Pradesh", "latitude": 25.2860, "longitude": 82.9880, "telephone": "+91-542-2368888", "mobile_number": "+91-542-2368888", "specialties": "Cardiology, Emergency, General Surgery", "facilities": "Cath Lab, Emergency, ICU", "emergency_services": "yes", "emergency_num": "+91-542-2368888", "hospital_category": "Private", "hospital_care_type": "Super Specialty", "total_num_beds": 180, "number_doctor": 36 },
    { "hospital_id": "HOSP-203", "hospital_name": "KGMU Super Specialty Hospital", "address_original_first_line": "Shah Mina Road, Chowk", "district": "Lucknow", "state": "Uttar Pradesh", "latitude": 26.8687, "longitude": 80.9168, "telephone": "+91-522-2257450", "mobile_number": "+91-522-2257450", "specialties": "Emergency, Trauma Care, Neurology, Cardiology, Nephrology", "facilities": "Trauma Center, Emergency, ICU, Advanced Surgery", "emergency_services": "yes", "emergency_num": "+91-522-2257450", "hospital_category": "Government", "hospital_care_type": "Medical University", "total_num_beds": 500, "number_doctor": 110 },
    { "hospital_id": "HOSP-204", "hospital_name": "Sanjay Gandhi PGIMS (SGPGI)", "address_original_first_line": "Raebareli Road", "district": "Lucknow", "state": "Uttar Pradesh", "latitude": 26.7450, "longitude": 80.9390, "telephone": "+91-522-2668004", "mobile_number": "+91-522-2668004", "specialties": "Cardiology, Nephrology, Oncology, Gastroenterology, Endocrinology", "facilities": "Super Specialty Care, Organ Transplant, Robotic Surgery", "emergency_services": "yes", "emergency_num": "+91-522-2668004", "hospital_category": "Government", "hospital_care_type": "Autonomous Apex Institute", "total_num_beds": 420, "number_doctor": 95 },
    { "hospital_id": "HOSP-205", "hospital_name": "Medanta Hospital Lucknow", "address_original_first_line": "Sector A, Pocket 1, Amar Shaheed Path", "district": "Lucknow", "state": "Uttar Pradesh", "latitude": 26.7950, "longitude": 81.0020, "telephone": "+91-522-4505050", "mobile_number": "+91-522-4505050", "specialties": "Cardiology, Emergency, Neurology, Organ Transplant, Critical Care", "facilities": "Advanced ICU, Cath Lab, Heart Institute, Emergency", "emergency_services": "yes", "emergency_num": "+91-522-4505050", "hospital_category": "Private", "hospital_care_type": "Multi Super Specialty", "total_num_beds": 350, "number_doctor": 75 },
    { "hospital_id": "HOSP-206", "hospital_name": "GSVM Medical College & Hallet Hospital", "address_original_first_line": "Swaroop Nagar", "district": "Kanpur", "state": "Uttar Pradesh", "latitude": 26.4820, "longitude": 80.3120, "telephone": "+91-512-2535555", "mobile_number": "+91-512-2535555", "specialties": "Emergency, Trauma Care, Orthopedics, Cardiology", "facilities": "Emergency, Trauma, Blood Bank, Surgery", "emergency_services": "yes", "emergency_num": "+91-512-2535555", "hospital_category": "Government", "hospital_care_type": "Tertiary Care", "total_num_beds": 380, "number_doctor": 70 }
]

def sync_csvs():
    new_hospitals = PRAYAGRAJ_HOSPITALS + REGIONAL_UP_CENTERS
    df_new = pd.DataFrame(new_hospitals)

    # 1. Update hospital_master.csv
    if os.path.exists(MASTER_PATH):
        df_master = pd.read_csv(MASTER_PATH, low_memory=False)
        # Remove existing IDs if re-running
        df_master = df_master[~df_master["hospital_id"].isin(df_new["hospital_id"])].copy()
        df_combined = pd.concat([df_new, df_master], ignore_index=True)
        df_combined.to_csv(MASTER_PATH, index=False)
        print(f"[OK] Updated {MASTER_PATH} with {len(df_new)} new Prayagraj & UP anchor hospitals (Total: {len(df_combined)} rows).")

    # 2. Update hospital_directory.csv
    if os.path.exists(DIR_PATH):
        df_dir = pd.read_csv(DIR_PATH, low_memory=False)
        # Rename columns to match directory format
        df_dir_new = df_new.rename(columns={
            "hospital_name": "Hospital_Name",
            "hospital_category": "Hospital_Category",
            "hospital_care_type": "Hospital_Care_Type",
            "address_original_first_line": "Address_Original_First_Line",
            "state": "State",
            "district": "District",
            "telephone": "Telephone",
            "mobile_number": "Mobile_Number",
            "emergency_num": "Emergency_Num",
            "total_num_beds": "Total_Num_Beds"
        })
        df_dir_combined = pd.concat([df_dir_new, df_dir], ignore_index=True)
        df_dir_combined.to_csv(DIR_PATH, index=False)
        print(f"[OK] Updated {DIR_PATH} (Total: {len(df_dir_combined)} rows).")

    print("\nDataset synchronization completed successfully!")

if __name__ == "__main__":
    sync_csvs()
