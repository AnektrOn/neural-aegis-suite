import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Img, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { name?: string; locale?: string }
const Welcome = ({ name, locale }: Props) => {
  const fr = locale === 'fr'
  return <Html lang={fr ? 'fr' : 'en'}><Head /><Preview>{fr ? 'Votre accès AEGIS Solo à vie est confirmé.' : 'Your AEGIS Solo lifetime access is confirmed.'}</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Space Grotesk, Arial, sans-serif' }}><Container style={{ padding: '32px 28px', maxWidth: '560px' }}>
      <Img src="https://aegis.humancatalystbeacon.com/__l5e/assets-v1/3d4f1b31-0e4f-4f1e-806f-ea6581e7a18c/aegis-logo-black.png" alt="AEGIS" width="96" height="96" />
      <Heading style={{ color: 'hsl(60, 5%, 7%)' }}>{fr ? 'Bienvenue dans AEGIS' : 'Welcome to AEGIS'}</Heading>
      <Text>{fr ? 'Bonjour' : 'Hello'}{name ? ` ${name}` : ''},</Text>
      <Text>{fr ? 'Votre code AppSumo a été activé. Votre compte dispose maintenant de l’accès AEGIS Solo à vie, sans LOGOS et sans abonnement récurrent.' : 'Your AppSumo code has been redeemed. Your account now has AEGIS Solo lifetime access, without LOGOS or a recurring subscription.'}</Text>
      <Button href="https://aegis.humancatalystbeacon.com/dashboard" style={{ backgroundColor: 'hsl(41, 60%, 39%)', color: '#ffffff', borderRadius: '12px', padding: '12px 20px' }}>{fr ? 'Ouvrir AEGIS' : 'Open AEGIS'}</Button>
      <Text>{fr ? 'Connectez-vous avec l’adresse utilisée pour activer votre code. Bienvenue parmi nous.' : 'Sign in with the email address used to redeem your code. We’re glad to welcome you.'}</Text>
    </Container></Body></Html>
}
export const template = { component: Welcome, subject: (data) => data.locale === 'fr' ? 'AEGIS — Votre accès Solo à vie est activé' : 'AEGIS — Your Solo lifetime access is activated', displayName: 'AppSumo welcome', previewData: { name: 'Alex', locale: 'en' } } satisfies TemplateEntry