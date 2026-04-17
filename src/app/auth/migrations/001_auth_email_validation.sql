-- =====================================================
-- SUPABASE AUTH - EMAIL VALIDATION MIGRATION
-- Executa este fitxer completament al SQL Editor
-- =====================================================

-- =====================================================
-- PAS 1: Crear taula public.users
-- Aquesta taula sincronitza amb auth.users per
-- permetre consultes públiques d'emails
-- =====================================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índex per a cerca ràpida per email
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (LOWER(email));

-- =====================================================
-- PAS 2: Crear triggers per sincronització automàtica
-- Quan es crea un usuari a auth.users, es crea automàticament
-- un registre a public.users
-- =====================================================

-- Funció: Crear registre quan es crea usuari a auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger:INSERT - quan es crea un usuari nou
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Funció: Actualitzar email quan canvia (preparat per a futur canvi d'email des de l'app)
CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.email != NEW.email THEN
        UPDATE public.users 
        SET email = NEW.email, updated_at = NOW()
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: UPDATE - quan es modifica l'email d'un usuari
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_update();

-- =====================================================
-- PAS 3: Migrar usuaris existents
-- Executa este bloc SOL si ja tens usuaris registrats
-- (Si acabes de crear la taula, este bloc omplirà les dades)
-- =====================================================

INSERT INTO public.users (id, email)
SELECT id, email FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM public.users WHERE public.users.id = auth.users.id
);

-- =====================================================
-- VERIFICACIÓ: Comprova que la migració ha funcionat
-- =====================================================

-- Mostra quants usuaris hi ha a cada taula
SELECT 
    (SELECT COUNT(*) FROM auth.users) AS auth_users_count,
    (SELECT COUNT(*) FROM public.users) AS public_users_count;

-- Mostra els usuaris migrats
SELECT * FROM public.users;
