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
import { Eye, EyeOff, Play, Sparkles } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useDemo } from '@/contexts/demo-context';
import Image from 'next/image';

const formSchema = z.object({
  email: z.string().email('Por favor, introduce un correo electrónico válido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  rememberMe: z.boolean().default(true),
});

export default function LoginPage() {
  const { login, enterDemoMode } = useAuth();
  const { enterDemo, startTour } = useDemo();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await login(values.email, values.password, values.rememberMe);
      toast({
        title: '¡Bienvenido de nuevo!',
        description: 'Has iniciado sesión correctamente.',
        className: 'bg-primary text-primary-foreground',
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      let errorMessage = 'Ocurrió un error al iniciar sesión.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'El correo electrónico o la contraseña son incorrectos.';
      }
      toast({
        variant: 'destructive',
        title: 'Error de autenticación',
        description: errorMessage,
      });
    } finally {
        setIsLoading(false);
    }
  }

  async function handleDemoMode() {
    setIsDemoLoading(true);
    try {
      enterDemoMode();
      enterDemo();
      toast({
        title: '🚀 Modo Demo activado',
        description: 'Explora todas las funcionalidades con datos de ejemplo.',
        className: 'bg-primary text-primary-foreground',
      });
      router.push('/dashboard');
      // Iniciar tour después de navegar
      setTimeout(() => startTour(), 1500);
    } finally {
      setIsDemoLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-blue-950/20 p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20 bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-1">
            <div className="w-16 h-16 relative mx-auto mb-2">
                <Image src="/logo.png" alt="TaskZenith Logo" fill className="object-contain" />
            </div>
            <CardTitle className="text-2xl font-bold font-headline">TaskZenith</CardTitle>
            <CardDescription className="text-base">
                Inicia sesión para acceder a tu espacio de trabajo
            </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <div className="relative">
                      <FormControl>
                        <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} className="bg-background/50 pr-10" />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-normal cursor-pointer">
                        Mantener sesión iniciada
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full text-lg mt-2" disabled={isLoading}>
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm">
             <span className="text-muted-foreground">¿Eres nuevo aquí? </span>
            <Link href="/signup" className="text-primary hover:underline font-medium">
              Crear cuenta con código
            </Link>
          </div>

          {/* Demo mode */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/50 transition-all"
              onClick={handleDemoMode}
              disabled={isDemoLoading}
            >
              {isDemoLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Cargando demo...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Probar en modo Demo
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Explora la app con datos de ejemplo y un tour guiado, sin necesidad de crear cuenta
            </p>
          </div>
        </CardContent>
      </Card>
      <div className="absolute bottom-4 text-xs text-muted-foreground opacity-50">
        TaskZenith Corporate v2.0
      </div>
    </div>
  );
}
