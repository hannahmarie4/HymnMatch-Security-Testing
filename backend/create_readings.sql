-- Drop table if exists
DROP TABLE IF EXISTS readings_list;

-- Create table
CREATE TABLE readings_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  liturgical_title TEXT NOT NULL,
  language TEXT NOT NULL, -- 'English' or 'Tagalog'
  pdf_url TEXT NOT NULL, -- Link to PDF file
  reading_type TEXT DEFAULT 'Complete', -- 'First Reading', 'Psalm', 'Gospel', 'Complete'
  created_at TIMESTAMP WITH TIME ZONE 
    DEFAULT timezone('utc'::text, now())
);

-- Seed data for May/June 2026
-- English Readings
INSERT INTO readings_list (date, liturgical_title, language, pdf_url, reading_type) VALUES
('2026-05-18', 'Monday of the Seventh Week of Easter', 'English', 'https://drive.google.com/file/d/1jQTFZgAz8H6Cg_QZcMNZb2uBTlBDJM4D/view?usp=share_link', 'Complete'),
('2026-05-19', 'Tuesday of the Seventh Week of Easter', 'English', 'https://drive.google.com/file/d/1uUh_Vp1KxxpnhwJqt5L3QySQ1zIfqxiB/view?usp=share_link', 'Complete'),
('2026-05-20', 'Wednesday of the Seventh Week of Easter', 'English', 'https://drive.google.com/file/d/1vquXY6UrQ7KPWCccsfhUZqteBMRqwUkv/view?usp=share_link', 'Complete'),
('2026-05-21', 'Thursday of the Seventh Week of Easter', 'English', 'https://drive.google.com/file/d/18kjuLQ6XYoBL3oo6ksHvx6TC-Meq8MQV/view?usp=share_link', 'Complete'),
('2026-05-22', 'Friday of the Seventh Week of Easter', 'English', 'https://drive.google.com/file/d/1Vc3GFkYrj3LZdn5g_Vzigi74lQJZichR/view?usp=share_link', 'Complete'),
('2026-05-23', 'Saturday of the Seventh Week of Easter', 'English', 'https://drive.google.com/file/d/1kB16vWwXr2dYiiFqb9AM-i__IVbJuQX9/view?usp=share_link', 'Complete'),
('2026-05-24', 'Pentecost Sunday (Solemnity)', 'English', 'https://drive.google.com/file/d/1t2dVuWN44C195HlRTy7If5ezM5goa9xk/view?usp=share_link', 'Complete'),
('2026-05-25', 'Monday of the Eighth Week in Ordinary Time', 'English', 'https://drive.google.com/file/d/1PCGXY0HakKplPyz6rbMDYeQ7aWoiVFS9/view?usp=share_link', 'Complete'),
('2026-05-26', 'Memorial of Saint Philip Neri, Priest', 'English', 'https://drive.google.com/file/d/1v-NAgZBu5XZ73iWPNYlobB5qVErsap_N/view?usp=share_link', 'Complete'),
('2026-05-27', 'Wednesday of the Eighth Week in Ordinary Time', 'English', 'https://drive.google.com/file/d/1cEj7RGwBRiTJNBC0v4yYtKR2SegxSznV/view?usp=share_link', 'Complete'),
('2026-05-28', 'Thursday of the Eighth Week in Ordinary Time', 'English', 'https://drive.google.com/file/d/1CEG4uTGA8M3ptlkzp9AZ9zXoFlWh4V8O/view?usp=share_link', 'Complete'),
('2026-05-29', 'Friday of the Eighth Week in Ordinary Time', 'English', 'https://drive.google.com/file/d/1U2wDvUKD0679lLIeaRB8S4QVlqEk5FS7/view?usp=share_link', 'Complete'),
('2026-05-30', 'Saturday of the Eighth Week in Ordinary Time', 'English', 'https://drive.google.com/file/d/1WBwN4JbQRCPcnJrOll5h2ttLtc7wIf36/view?usp=share_link', 'Complete'),
('2026-05-31', 'The Solemnity of the Most Holy Trinity', 'English', 'https://drive.google.com/file/d/1074rsD4yx-6ulP8d6pMrnVGbMwXqUrIi/view?usp=share_link', 'Complete'),
('2026-06-01', 'Memorial of the Blessed Virgin Mary, Mother of the Church', 'English', 'https://drive.google.com/file/d/1jQTFZgAz8H6Cg_QZcMNZb2uBTlBDJM4D/view?usp=share_link', 'Complete'),
('2026-06-02', 'Tuesday of the Ninth Week in Ordinary Time', 'English', 'https://drive.google.com/file/d/1uUh_Vp1KxxpnhwJqt5L3QySQ1zIfqxiB/view?usp=share_link', 'Complete');

-- Tagalog Readings
INSERT INTO readings_list (date, liturgical_title, language, pdf_url, reading_type) VALUES
('2026-05-18', 'Lunes ng Ikapitong Linggo ng Pasko ng Pagkabuhay', 'Tagalog', 'https://drive.google.com/file/d/1FROar2aag6wgL7q6XwY8VyuaSUqb0ddu/view?usp=share_link', 'Complete'),
('2026-05-19', 'Martes ng Ikapitong Linggo ng Pasko ng Pagkabuhay', 'Tagalog', 'https://drive.google.com/file/d/12jJSQ2tD4lxVvLnyAv9F68RZU8Fo6xUr/view?usp=share_link', 'Complete'),
('2026-05-20', 'Miyerkules ng Ikapitong Linggo ng Pasko ng Pagkabuhay', 'Tagalog', 'https://drive.google.com/file/d/1QztD9DbeS4xJHPtistQKLzU6eeL6pJNI/view?usp=share_link', 'Complete'),
('2026-05-21', 'Huwebes ng Ikapitong Linggo ng Pasko ng Pagkabuhay', 'Tagalog', 'https://drive.google.com/file/d/1gIiLskDSnbBbrJ8Miq9oWJgb-NqlqJFV/view?usp=share_link', 'Complete'),
('2026-05-22', 'Biyernes ng Ikapitong Linggo ng Pasko ng Pagkabuhay', 'Tagalog', 'https://drive.google.com/file/d/1-MVLVPibpc8BCqHvIEJzSm8z6X4edUbn/view?usp=share_link', 'Complete'),
('2026-05-23', 'Sabado ng Ikapitong Linggo ng Pasko ng Pagkabuhay', 'Tagalog', 'https://drive.google.com/file/d/10cbVN8c2mg-_3nLlYf8Fasfq7L9nkrB5/view?usp=share_link', 'Complete'),
('2026-05-24', 'Linggo ng Pentekostes (Dakilang Kapistahan)', 'Tagalog', 'https://drive.google.com/file/d/1oPUyVvrpQ9BQeOVp-iyXSh7NnNAsMI0Y/view?usp=share_link', 'Complete'),
('2026-05-25', 'Lunes ng Ikawalong Linggo sa Karaniwang Panahon', 'Tagalog', 'https://drive.google.com/file/d/1o3JGxBYYeiFn4IULxqHgHXV6tjPcWQtt/view?usp=share_link', 'Complete'),
('2026-05-26', 'Paggunita kay San Felipe Neri, Pari', 'Tagalog', 'https://drive.google.com/file/d/1IZU9aCiAOvH86JE2HKVXbm8TdnOlmgd5/view?usp=share_link', 'Complete'),
('2026-05-27', 'Miyerkules ng Ikawalong Linggo sa Karaniwang Panahon', 'Tagalog', 'https://drive.google.com/file/d/1IQAtSoENM0zjBIHgjxC49gFOieT8iTET/view?usp=share_link', 'Complete'),
('2026-05-28', 'Huwebes ng Ikawalong Linggo sa Karaniwang Panahon', 'Tagalog', 'https://drive.google.com/file/d/1MMxbtS8bDG9_U-f1m5zu_dXCy19Q2KYa/view?usp=share_link', 'Complete'),
('2026-05-29', 'Biyernes ng Ikawalong Linggo sa Karaniwang Panahon', 'Tagalog', 'https://drive.google.com/file/d/11UaMwjWNmYavmH33iIqLFhW0uHAzxhA7/view?usp=share_link', 'Complete'),
('2026-05-30', 'Sabado ng Ikawalong Linggo sa Karaniwang Panahon', 'Tagalog', 'https://drive.google.com/file/d/156ZGSp9M6E99ZxknpY3KZ2Cje4iosODB/view?usp=share_link', 'Complete'),
('2026-05-31', 'Dakilang Kapistahan ng Banal na Trinidad', 'Tagalog', 'https://drive.google.com/file/d/1FROar2aag6wgL7q6XwY8VyuaSUqb0ddu/view?usp=share_link', 'Complete'),
('2026-06-01', 'Paggunita sa Mahal na Birheng Maria, Ina ng Simbahan', 'Tagalog', 'https://drive.google.com/file/d/12jJSQ2tD4lxVvLnyAv9F68RZU8Fo6xUr/view?usp=share_link', 'Complete'),
('2026-06-02', 'Martes ng Ikasiyam na Linggo sa Karaniwang Panahon', 'Tagalog', 'https://drive.google.com/file/d/1QztD9DbeS4xJHPtistQKLzU6eeL6pJNI/view?usp=share_link', 'Complete');
