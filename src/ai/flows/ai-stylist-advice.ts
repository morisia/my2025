'use server';
/**
 * @fileOverview AI სტილისტის ნაკადი მოდის რჩევებისა და დამატებითი ტანსაცმლის ნივთების შემოთავაზებისთვის, ტრადიციული ქართული ესთეტიკის გათვალისწინებით.
 *
 * - getStylistAdvice - ფუნქცია, რომელიც ამუშავებს სტილისტის რჩევების პროცესს.
 * - AiStylistAdviceInput - getStylistAdvice ფუნქციის შეყვანის ტიპი.
 * - AiStylistAdviceOutput - getStylistAdvice ფუნქციის დაბრუნების ტიპი.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiStylistAdviceInputSchema = z.object({
  clothingItem: z.string().describe('ტანსაცმლის ნივთი, რომლისთვისაც გსურთ რჩევის მიღება.'),
  userStyle: z.string().describe('მომხმარებლის ამჟამინდელი სტილის უპირატესობები.'),
  occasion: z.string().describe('შემთხვევა, რომლისთვისაც განკუთვნილია სამოსი.'),
});
export type AiStylistAdviceInput = z.infer<typeof AiStylistAdviceInputSchema>;

const AiStylistAdviceOutputSchema = z.object({
  advice: z.string().describe('მოდის რჩევები და შემოთავაზებები დამატებითი ტანსაცმლის ნივთებისთვის.'),
});
export type AiStylistAdviceOutput = z.infer<typeof AiStylistAdviceOutputSchema>;

export async function getStylistAdvice(input: AiStylistAdviceInput): Promise<AiStylistAdviceOutput> {
  return aiStylistAdviceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiStylistAdvicePrompt',
  input: {schema: AiStylistAdviceInputSchema},
  output: {schema: AiStylistAdviceOutputSchema},
  prompt: `შენ ხარ მოდის სტილისტი, რომელიც სპეციალიზებულია ტრადიციულ ქართულ ესთეტიკაზე. მომხმარებელი მოგაწვდის ტანსაცმლის ნივთს, მის სტილის უპირატესობებს და შემთხვევას. შენ მიაწვდი მოდის რჩევებს და შესთავაზებ დამატებით ტანსაცმლის ნივთებს, ტრადიციული ქართული ესთეტიკის გათვალისწინებით. პასუხი უნდა იყოს ქართულ ენაზე.

ტანსაცმლის ნივთი: {{{clothingItem}}}
მომხმარებლის სტილი: {{{userStyle}}}
შემთხვევა: {{{occasion}}}

მიეცი დეტალური რჩევა, გაითვალისწინე მომხმარებლის სტილი და შემთხვევა. შესთავაზე კონკრეტული ქართული ტანსაცმლის ნივთები, რომლებიც შეავსებს მოცემულ ნივთს.`,
});

const aiStylistAdviceFlow = ai.defineFlow(
  {
    name: 'aiStylistAdviceFlow',
    inputSchema: AiStylistAdviceInputSchema,
    outputSchema: AiStylistAdviceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
