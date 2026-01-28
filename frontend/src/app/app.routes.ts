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
    {path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard]},
    {path: 'vestidos', component: VestidosComponent, canActivate: [AuthGuard]},
    {path: 'vestido/:id', component: InfoVestidoComponent, canActivate: [AuthGuard]},
    {path: 'usuarios', component: UsuariosComponent, canActivate: [AuthGuard]},
    {path: 'facturacion', component: FacturacionComponent, canActivate: [AuthGuard]}
];
