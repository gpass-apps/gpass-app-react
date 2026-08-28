import { Rols, TypeControl, TypeInput } from "../types";
import { UploadFile } from "antd/es/upload";
import { FormRule } from 'antd';
import { UploadListType } from 'antd/lib/upload/interface';
import dayjs, { Dayjs } from "dayjs";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Event {
  id?: string;
  name: string;
  initialDate: Date;
  finalDate: Date;
  initialDateFormated?: string;
  finalDateFormated?: string;
  image?: UploadFile<any>[] | string;
  disabled?: boolean;
  createAt: Date;
  total?: number;
  couponsByEmployee?: number;
  textExchange: string;
  companyName: Company | string;
  companyUid: Company | string;
  userAmbassadorIds: string[];
  userScannerIds: string[];
  ambassadorsRanges: AmbassadorRanges[];
}

export interface AmbassadorRanges {
  userAmbassadorId: string;
  ranges: Range[];
}

export interface Range {
  init: boolean;
  index: number;
  startRange?: number;
  endRange?: number;
  userScannerIds?: string[];
}

export interface Ticket {
  id?: string;
  eventId: string;
  number: number;
  isScanned: "Si" | "No";
  dateScanned?: Date;
  userAmbassadorId?: string;
  userAmbassadorName?: string;
  userScannerId?: string;
  userScannerName?: string;
  isDownloaded: boolean;
  createAt: Date;
}

export type EventForm = Omit<Event, "initialDate" | "finalDate"> & {
  initialDate: Dayjs;
  finalDate: Dayjs;
};

export interface Company {
  id?: string;
  name: string;
  phone: string;
  email: string;
  image?: UploadFile<any>[] | string;
  address?: string;
  disabled?: boolean;
  createAt: Date;
}

export interface User {
  id?: string;
  name: string;
  phone: string;
  email: string;
  companyName: string;
  zone?: string;
  companyUid: Company | string;
  password: string;
  confirmPassword?: string;
  role?: Rols;
  state: string;
  createAt: Date,
  disabled?: boolean;
}

export interface UserUpload extends User {
  numberOfCoupons?: number;
}

export interface CustomInput {
  typeControl: TypeControl;
  typeInput?: TypeInput;
  value?: any;
  name: string;
  md?: number;
  label?: string;
  options?: Option[];
  show?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  rules?: FormRule[];
  onChange?: (value: any) => void;
  styleFI?: React.CSSProperties;
  required?: boolean;
  accept?: string;
  maxCount?: number;
  multiple?: boolean;
  loading?: boolean;
  listType?: UploadListType;
  disabledDate?: (date: Dayjs) => boolean;
  withOutCrop?: boolean;
}

export interface Option {
  value: string | number;
  text: string;
}