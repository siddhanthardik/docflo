with open('prisma/schema.prisma', 'r', encoding='utf-8') as f:
    content = f.read()

practitioner_model = """
model Practitioner {
  id                String       @id @default(cuid())
  doctorId          String
  name              String
  email             String?
  phone             String?
  specialty         String?
  otherSpecialty    String?
  qualification     String?
  registrationNumber String?
  consultationFee   Float?
  duration          Int?
  bufferTime        Int?
  isOwner           Boolean      @default(false)
  isActive          Boolean      @default(true)
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  doctor            Doctor       @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  appointments      Appointment[]
  patients          Patient[]

  @@index([doctorId])
  @@map("practitioners")
}
"""
if 'model Practitioner {' not in content:
    content = content.replace('model Appointment {', practitioner_model + '\nmodel Appointment {')
    with open('prisma/schema.prisma', 'w', encoding='utf-8') as f:
        f.write(content)
