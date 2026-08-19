-- ====================================================================
-- Allianz Payment Tracker - Supabase Database Schema & RLS Setup
-- ====================================================================

-- 1. Create the 'students' table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    curso TEXT NOT NULL,
    paid_status BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create useful indexes for rapid search and filtering
CREATE INDEX IF NOT EXISTS idx_students_curso ON public.students(curso);
CREATE INDEX IF NOT EXISTS idx_students_paid_status ON public.students(paid_status);
CREATE INDEX IF NOT EXISTS idx_students_name ON public.students(name);

-- 3. Automatic updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_students_updated_at ON public.students;
CREATE TRIGGER set_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- 5. Row Level Security Policies
DROP POLICY IF EXISTS "Allow anonymous read access to students" ON public.students;
CREATE POLICY "Allow anonymous read access to students"
    ON public.students
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert access to students" ON public.students;
CREATE POLICY "Allow anonymous insert access to students"
    ON public.students
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous update access to students" ON public.students;
CREATE POLICY "Allow anonymous update access to students"
    ON public.students
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous delete access to students" ON public.students;
CREATE POLICY "Allow anonymous delete access to students"
    ON public.students
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- 6. Seed All 156 Students
INSERT INTO public.students (name, curso, paid_status)
VALUES 
    ('Almécija Sánchez Clementina del Valle', '5R', false),
    ('Ancares Rojas Augusto Ignacio', '5P', false),
    ('Artigas Aravena Juan José', '5R', false),
    ('Balbontin Novoa Santiago', '5R', false),
    ('Beriestain Escoda Augusto Simón', '5R', false),
    ('Carvajal Gutiérrez Amanda Sofia', '5P', false),
    ('Carvajal Gutiérrez Vicente Andrés', '5R', false),
    ('Contreras Yañez Matias Javier', '5P', false),
    ('Dinamarca Araya Rosario Isabel', '5P', false),
    ('Galleguillos Leiva Elena Paz', '5P', false),
    ('Guzmán Candia Ricardo Antonio', '5P', false),
    ('Isaacs Izaurieta Facundo Tomas', '5R', false),
    ('Moguilevsky Hovsepian Eva', '5P', false),
    ('Muñoz Mora Franco Esteban', '5P', false),
    ('Pastén Navas Florencia', '5P', false),
    ('Sambuceti Ghisolfo Antonia', '5P', false),
    ('Atán Mendoza Ignacia Agustina', '6L', false),
    ('Belisario Gauthier Alanna Sofia', '6V', false),
    ('Bustamante Brierley Santiago', '6V', false),
    ('Castro Napolitano Diego Agustin', '6V', false),
    ('Cogollor Olivares Tomas Ignacio', '6V', false),
    ('Diaz Burgos Maite Sofia', '6V', false),
    ('Dominguez Herreros Anton Jose', '6L', false),
    ('Fuentealba Aguilera Alfonso Julian', '6V', false),
    ('Gallardo de la Paz Emma Antonella', '6V', false),
    ('Guler Mackenna Kenneth', '6L', false),
    ('Guerra Alvarez Julieta Isidora Del Carmen', '6L', false),
    ('Jousse Páez Micaela', '6V', false),
    ('Jousse Páez Thiago', '6L', false),
    ('Lee Elsa', '6L', false),
    ('Lopez Calderon Beatriz Antonia', '6V', false),
    ('Modermot Padilla Stella', '6L', false),
    ('Olate Hadad Bruno', '6L', false),
    ('Requena Hernández Lorenza', '6V', false),
    ('Silva Trujillo Ignacia Catalina', '6L', false),
    ('Tagle Urzúa Lean', '6V', false),
    ('Vieira Coronel Gulliana', '6V', false),
    ('Zapata Murcia Maite Sofia', '6L', false),
    ('Alburquenque Santibáñez Agustín Ignacio', '7J', false),
    ('Allel Figueroa Lucas', '7M', false),
    ('Ancares Rojas José Alfredo', '7J', false),
    ('Arriagada Bermudez Julia', '7J', false),
    ('Boñon Negron Camila Valentina', '7J', false),
    ('Casanueva Pinto Benjamin', '7M', false),
    ('Castillo Lazcano Josefa', '7M', false),
    ('Correa Godoy Elisa Ignacia', '7J', false),
    ('Escalona Canales Facundo Ignacio', '7M', false),
    ('Landesman Montabone Tomás', '7J', false),
    ('Mol Martins Maria Eduarda', '7M', false),
    ('Mora Manriquez Claudia Antonia', '7J', false),
    ('Parragué Govorcin Joaquin', '7J', false),
    ('Retamal Alvarez de Araya José Tomás', '7M', false),
    ('Ricart Osorio Lucas', '7J', false),
    ('Salgado Valech Nicolas', '7M', false),
    ('Salinas Venegas Fernando Andres', '7M', false),
    ('Sepulveda Rivas Catalina Belen', '7M', false),
    ('Soto Dumont Agustina', '7J', false),
    ('Staforelli Araya Elisa Carolina', '7M', false),
    ('Uriarte Berrios Catalina Ignacia', '7M', false),
    ('Zerbi Montenegro Ema', '7J', false),
    ('Zurob Lanzarini Olivia', '7J', false),
    ('Almécija Sánchez Cristóbal Jesús', '8E', false),
    ('Baeza Cárdenas Mateo José', '8M', false),
    ('Baeza Cárdenas Rafaela Aurora', '8E', false),
    ('Beriestain Escoda Julia Elena', '8M', false),
    ('Bolognesi Aguado Bruno', '8M', false),
    ('Cerda Arias Martina', '8M', false),
    ('Cogollor Olivares Valentina Ignacia', '8M', false),
    ('Contreras Yañez Tomás José', '8E', false),
    ('Cozzi Ortiz Ema', '8M', false),
    ('Dinamarca Araya José Pedro', '8E', false),
    ('Ferreira Cardemil Zoe', '8E', false),
    ('Fuenzalida Montecinos Isidora Constanza', '8E', false),
    ('Grez Pérez Gaspar Ignacio', '8M', false),
    ('Guler Mackenna Isabel', '8M', false),
    ('Jang Jihwan', '8E', false),
    ('Jousse Páez Zoe', '8E', false),
    ('Lucero Carreño Benjamin Andrés', '8E', false),
    ('Pastén Navas Magdalena Antonia', '8E', false),
    ('Perez Ruz Laura Carolina', '8M', false),
    ('Torres Zhang Isidora Liyi', '8M', false),
    ('Vergara Marin Matias Ricardo', '8M', false),
    ('Allel Figueroa Emma', '9P', false),
    ('Aparicio Riera Nicolás', '9D', false),
    ('Artigas Aravena Pedro Andrés', '9P', false),
    ('Cerda Guerrero Jorge Alejandro', '9D', false),
    ('Concha Pastene Camilo Agustin', '9D', false),
    ('Delgado Noches Felipe Antonio', '9P', false),
    ('Landesman Montabone Emma', '9D', false),
    ('Lee Ithiel', '9D', false),
    ('Manns Sepúlveda Rafael', '9D', false),
    ('Molina Álvarez Alicia Fernanda', '9P', false),
    ('Muñoz Roa Emilia Alejandra', '9D', false),
    ('Nervi Medina Bianca Simona', '9D', false),
    ('Opazo Noguez Josefina Ignacial', '9P', false),
    ('Pardo Jiménez Julia', '9D', false),
    ('Parraqué Govorcin Samuel', '9D', false),
    ('Parragué Moses Alma', '9P', false),
    ('Rechter Aguilera Raimundo León', '9D', false),
    ('Retamal Nuñez Constanza', '9P', false),
    ('Salinas Venegas Sofia Francisca', '9P', false),
    ('Sambuceti Ghisolfo Domenica', '9D', false),
    ('Schrader Sánchez Rafaella', '9P', false),
    ('Seguel Pucciarelli Josefa Amalia', '9D', false),
    ('Senn Flores Gabriel Alfredo', '9P', false),
    ('Torres Carmona Zoé', '9P', false),
    ('Aldunate Barrionuevo José Felipe', '10B', false),
    ('Boñon Negrón Sofia Abigail', '10B', false),
    ('Cabrera Ronda Rafael Ignacio', '10P', false),
    ('Cartes Quintana Matilde Amelia', '10P', false),
    ('Contreras Yañez Sebastián León', '10P', false),
    ('Correa Gonzalez Dominga Maria', '10P', false),
    ('Curotto Alvarez Franco', '10P', false),
    ('Diaz Novoa Benjamin', '10P', false),
    ('Fuenzalida Montecinos Nicolás Ignacio', '10P', false),
    ('Grez Pérez Gaspar José Miquel', '10P', false),
    ('Grune Toso Trinidad', '10B', false),
    ('Guler Mackenna Florencia', '10P', false),
    ('Ljubetic Soto Tonka Maria', '10B', false),
    ('Nervi Martinez Amanda Jesús', '10P', false),
    ('Trujillo Bascur José Tomás', '10P', false),
    ('Vega Salamino Celeste Amanda', '10P', false),
    ('Acuña Díaz Francisca', '11R', false),
    ('Alarcón Varela Gonzalo', '11AM', false),
    ('Amigo Marin Agustin Antonio', '11AM', false),
    ('Aparicio Riera María Jesús', '11AM', false),
    ('Castro Napolitano Tomás Ignacio', '11AM', false),
    ('Chueco López Alonso', '11R', false),
    ('Concha Pastene Martin Andrés', '11AM', false),
    ('Fuentealba Aguilera Agustina Antonia', '11AM', false),
    ('Kaiser Valdivieso Agustin Ignacio', '11AM', false),
    ('Mora Manriquez Montserrat Aracell', '11R', false),
    ('Rechter Aguilera Sofia Macarena', '11R', false),
    ('Retamal Núñez Vicente Javier', '11R', false),
    ('Rojas Farias Florencia Belen', '11R', false),
    ('Soto Sandoval Gabriela', '11R', false),
    ('Uriarte Berrios Benjamin Ignacio', '11AM', false),
    ('Venegas Muñoz Gabriel', '11AM', false),
    ('Bolognesi Aguado Emilia', '12E', false),
    ('Bolognesi Raineri Matteo', '12D', false),
    ('Boñon Negrón Mauricio Santiago', '12D', false),
    ('Bunster Bunster Josefina', '12E', false),
    ('Curotto Álvarez Rafaella', '12D', false),
    ('Diaz Betancourt José Tomás', '12D', false),
    ('Lee Joung Dong Won', '12E', false),
    ('Mendizabal Martorell Melina', '12D', false),
    ('Nervi Medina Rafaella Luciana', '12D', false),
    ('Opazo Noguez Matías', '12E', false),
    ('Park You Fabián Sejun', '12E', false),
    ('Parragué Moses Nicolás Eliel', '12E', false),
    ('Pérez Ruz Gabriela Constanza', '12E', false),
    ('Puentes León Emily Belén', '12E', false),
    ('Rojas Farias Maximiliano Andres Leon Claudio', '12D', false),
    ('Silva Browne Isidora', '12E', false),
    ('Vergara Rodriguez Martin Felipe', '12E', false),
    ('Vergara Rodriguez Tomás Eugenio', '12D', false)
ON CONFLICT DO NOTHING;
