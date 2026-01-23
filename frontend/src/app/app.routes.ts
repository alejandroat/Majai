import { Routes } from '@angular/router';
import { LoginComponent } from '../app/features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { AuthGuard } from './core/guards/auth/auth.guard';
import { VestidosComponent } from './features/vestidos/vestidos.component';
import { UsuariosComponent } from './features/auth/usuarios/usuarios.component';
import { FacturacionComponent } from './features/facturacion/facturacion.component';
import { InfoVestidoComponent } from './features/info-vestido/info-vestido.component';

export const routes: Routes = [
    {path: '', redirectTo: 'login', pathMatch: 'full'},
    {path: 'login', component: LoginComponent},
    {path: 'dashboard', component: DashboardComponent},
    {path: 'vestidos', component: VestidosComponent},
    {path: 'vestido/:id', component: InfoVestidoComponent},
    {path: 'usuarios', component: UsuariosComponent},
    {path: 'facturacion', component: FacturacionComponent}
];
