'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const formSchema = z.object({
  displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  email: z.string().email('Por favor, introduce un correo electrónico válido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  accessCode: z.string().min(1, 'Se requiere un código de acceso.'),
});

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      accessCode: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Basic hardcoded check for demonstration
    if (values.accessCode !== 'TASKZENITH-ADMIN' && values.accessCode !== 'TASKZENITH-CORP') {
        form.setError('accessCode', { message: 'Código de acceso inválido. Contacta a un administrador.' });
        return;
    }

    setIsLoading(true);
    try {
      // Determine role based on access code
      const role = values.accessCode === 'TASKZENITH-ADMIN' ? 'admin' : 'operator';
      await signup(values.email, values.password, values.displayName, role);
      toast({
        title: '¡Cuenta creada!',
        description: 'Bienvenido a TaskZenith. Ya puedes iniciar sesión.',
        className: 'bg-primary text-primary-foreground',
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      let errorMessage = 'Ocurrió un error al registrar la cuenta.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este correo electrónico ya está en uso.';
      }
      toast({
        variant: 'destructive',
        title: 'Error de registro',
        description: errorMessage,
      });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-blue-950/20 p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20 bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-1">
             <div className="w-12 h-12 relative mx-auto mb-2">
                <Image src="/logo.png" alt="Logo" fill className="object-contain" />
             </div>
            <CardTitle className="text-2xl font-bold font-headline">Crear nueva cuenta</CardTitle>
            <CardDescription>
              Solo disponible mediante invitación de un administrador.
            </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu nombre" {...field} className="bg-background/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input placeholder="nombre@empresa.com" {...field} className="bg-background/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="bg-background/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                  control={form.control}
                  name="accessCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-primary font-semibold">Código de Invitación</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Código provisto por admin" {...field} className="bg-background/50 border-primary/30 focus-visible:ring-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
              />
              <Button className="w-full text-lg mt-6" type="submit" disabled={isLoading}>
                {isLoading ? 'Creando cuenta...' : 'Registrarse'}
              </Button>
              <div className="text-center text-sm mt-4">
                   ¿Ya tienes cuenta?{' '}
                  <Link href="/login" className="text-primary hover:underline font-medium">Inicia sesión</Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
