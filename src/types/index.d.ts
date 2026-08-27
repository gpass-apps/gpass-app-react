import { Dispatch, SetStateAction } from "react";
import dayjs from "dayjs";

export type Rols = "SuperAdministrador" | "Administrador" | "Embajador" | "Lector" | "Empleado";
export type OptionsValue = string | number | Boolean | dayjs.Dayjs | null | undefined;
export type TypeControl = 'input' | 'select' | 'date' | 'checkbox' | 'radio' | 'autocomplete' | 'textarea' | 'file' | 'timeRangePicker' | 'phone';
export type TypeInput = 'text' | 'number' | 'password' | 'email';
export type TypeRute = "create" | "update";
export type DS<T> = Dispatch<SetStateAction<T>>;