import os
import psycopg2

db_url = None
with open('.env', 'r') as f:
    for line in f:
        if line.startswith('DATABASE_URL='):
            db_url = line.strip().split('=')[1].strip('"').strip("'")
            break

conn = psycopg2.connect(db_url)
cur = conn.cursor()

try:
    cur.execute("ALTER TYPE \"AppointmentStatus\" ADD VALUE 'CONFIRMED';")
    conn.commit()
except Exception as e:
    print('Error adding CONFIRMED:', e)
    conn.rollback()

try:
    cur.execute("ALTER TYPE \"AppointmentStatus\" ADD VALUE 'CHECKED_IN';")
    conn.commit()
except Exception as e:
    print('Error adding CHECKED_IN:', e)
    conn.rollback()

cur.execute("UPDATE \"appointments\" SET \"status\" = 'CONFIRMED' WHERE \"status\" = 'SCHEDULED';")
conn.commit()

cur.close()
conn.close()
print('Successfully updated database rows.')
