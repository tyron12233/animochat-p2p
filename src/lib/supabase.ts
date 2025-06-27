import { createClient } from "@supabase/supabase-js";


const supabaseUrl = 'https://wkafplnaexyyuobfufxa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYWZwbG5hZXh5eXVvYmZ1ZnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0NjYwODEsImV4cCI6MjA2MTA0MjA4MX0.Sp9g2aWN24QoymYPoYJbxInnFNMautc26uJ1ba6Dvdc';

export const supabase = createClient(supabaseUrl, supabaseKey);