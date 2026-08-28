import { message } from "antd";
import { RcFile } from "antd/es/upload";
import { validCouponColumns, mapExcelHeadersCoupons } from "../../../constants";
import { Event, UserUpload } from "../../../interfaces";
import { getWorkbookFromFile, isObject } from "../../../utils/functions";

export const getUsersUploadFromExcel = async (file: RcFile, event: Event) => {
  const workbook = await getWorkbookFromFile(file);
  const worksheet = workbook.getWorksheet(1);

  if (!worksheet) {
    throw new Error("Error, hoja de excel no encontrada");
  }

  const users: UserUpload[] = [];
  const headers = (worksheet.getRow(1).values as string[]).slice(1).map(h => h.toLocaleLowerCase());

  const invalidColumns = headers.filter(h => !validCouponColumns.includes(h));

  if (invalidColumns.length) {
    throw new Error(`Columnas inválidas: ${invalidColumns.join(", ")}`);
  }

  const userKeys = headers.map(h => mapExcelHeadersCoupons[h]);
  const rows = worksheet
    .getSheetValues()
    .slice(2).map(row => (row as Array<any>)
      .slice(1))
    .filter(row =>
      !row.every(
        cell =>
          cell === null ||
          cell === undefined ||
          cell.toString().trim() === ""
      )
    );

  for (const row of rows) {
    let user: UserUpload = {} as UserUpload;

    for (let i = 0; i < userKeys.length; i++) {
      const key = userKeys[i];
      let cellValue = row[i];

      if (typeof cellValue === "undefined" || cellValue === null) {
        cellValue = "";
      }

      if (key === "numberOfCoupons") {
        const numberOfCoupons = event.couponsByEmployee || +cellValue;

        if (typeof numberOfCoupons !== "number" || isNaN(numberOfCoupons) || !numberOfCoupons) {
          console.log("error", rows.indexOf(row) + 2);
          throw new Error(`Valor inválido en la cantidad de cupones, fila del excel: ${rows.indexOf(row) + 2}`);
        }

        user = { ...user, [key]: numberOfCoupons };
        continue;
      }

      if (isObject(cellValue) && "result" in cellValue) {
        cellValue = (cellValue.result as number).toString();
      }

      user = { ...user, [key]: cellValue.toString() };
    }

    users.push(user);
  };

  return users;
};