import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { name?: string; email?: string; createdAt?: string; redeemedAt?: string; codeSuffix?: string }
const AdminNotice = ({ name, email, createdAt, redeemedAt, codeSuffix }: Props) => <Html lang="fr"><Head /><Preview>Un compte a activé son accès AppSumo AEGIS Solo à vie.</Preview><Body style={{ backgroundColor: '#ffffff', fontFamily: 'Space Grotesk, Arial, sans-serif' }}><Container style={{ padding: '32px 28px', maxWidth: '560px' }}>
  <Heading style={{ color: 'hsl(60, 5%, 7%)' }}>AEGIS — Activation AppSumo</Heading>
  <Text>Utilisateur : {name || 'Utilisateur AEGIS'}</Text><Text>Adresse email du compte : {email || 'Non renseignée'}</Text>
  <Text>Compte créé le : {createdAt || 'Non renseigné'} (UTC).</Text><Text>Code activé le : {redeemedAt || 'Non renseigné'} (UTC).</Text>
  <Text>Code : …{codeSuffix || '****'}. Accès accordé : AEGIS Solo à vie, sans LOGOS.</Text>
  <Text>La création du compte et l’activation sont deux événements distincts ; les dates ci-dessus correspondent aux données enregistrées.</Text>
</Container></Body></Html>
export const template = { component: AdminNotice, subject: 'AEGIS — Code AppSumo utilisé', displayName: 'AppSumo admin notice', previewData: { name: 'Alex', email: 'alex@example.test', codeSuffix: 'AB12', createdAt: '2026-11-18T00:00:00Z', redeemedAt: '2026-11-18T00:05:00Z' } } satisfies TemplateEntry