import { Metadata } from 'next';

import Client from './Client';

export const metadata: Metadata = {
  description: 'Manage and send newsletters to Phở.chat subscribers',
  title: 'Newsletter Admin | Phở.chat',
};

export default function NewsletterAdminPage() {
  return <Client />;
}
