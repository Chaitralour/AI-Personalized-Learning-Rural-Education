from db import get_db_connection

connection = get_db_connection()

if connection:
    print("RuralEdu database connected successfully!")

    cursor = connection.cursor()
    cursor.execute("SHOW TABLES")

    for table in cursor.fetchall():
        print(table[0])

    cursor.close()
    connection.close()
else:
    print("Could not connect to RuralEdu database.")