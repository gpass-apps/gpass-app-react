import { lazy } from "react";
import { PathRouteProps } from 'react-router-dom';
import AssignTickets from "../views/events/assignTickets";
import Coupons from "../views/events/coupons";

const LandingPage = lazy(() => import('../views/landingPage'));
const Companies = lazy(() => import('../views/companies'));
const CompaniesRegister = lazy(() => import('../views/companies/create'));
const Events = lazy(() => import('../views/events'));
const EventsRegister = lazy(() => import('../views/events/create'));
const Users = lazy(() => import('../views/users'));
const UsersRegister = lazy(() => import('../views/users/create'));
const Scanner = lazy(() => import('../views/events/qr'));
const Tickets = lazy(() => import('../views/events/tikets'));
const Lectors = lazy(() => import('../views/events/lectors'));

const routes: PathRouteProps[] = [
  {
    path: '/',
    element: <LandingPage />
  },
  {
    path: '/empresas',
    element: <Companies />
  },
  {
    path: '/empresas/registrar',
    element: <CompaniesRegister />
  },
  {
    path: '/empresas/editar',
    element: <CompaniesRegister />
  },
  {
    path: "/eventos",
    element: <Events />
  },
  {
    path: "/eventos/registrar",
    element: <EventsRegister />
  },
  {
    path: '/eventos/editar',
    element: <EventsRegister />
  },
  {
    path: '/eventos/boletos',
    element: <Tickets />
  },
  {
    path: '/eventos/asignar-boletos',
    element: <AssignTickets />
  },
  {
    path: '/eventos/lectores',
    element: <Lectors />
  },
  {
    path: '/lector',
    element: <Scanner />
  },
  {
    path: "/usuarios",
    element: <Users />
  },
  {
    path: "/usuarios/registrar",
    element: <UsersRegister />
  },
  {
    path: "/usuarios/editar",
    element: <UsersRegister />
  },
  {
    path: "/eventos/cupones",
    element: <Coupons />
  },
  {
    path: '*',
    element: <div>404 not found</div>
  }
];

export default routes;