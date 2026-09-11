import { RcFile } from "antd/es/upload";
import { validCouponColumns, mapExcelHeadersCoupons } from "../../constants";
import { Coupon, Event, UserUpload } from "../../interfaces";
import { getArrayChunk, getWorkbookFromFile, isObject } from "../../utils/functions";
import { QueryConstraint, where, orderBy, limit } from "firebase/firestore";
import { getCollectionGeneric } from "../../services/firebase";

export const getUsersUploadFromExcel = async (file: RcFile, events: Event[]) => {
  console.log(events.find(e => e.name === "Evento de prueba"));


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
    .slice(2)
    .map(
      row => (row as Array<any>).slice(1)
    )
    .filter(row =>
      !row.every(
        cell =>
          cell === null ||
          cell === undefined ||
          cell.toString().trim() === ""
      )
    );

  for (const row of rows) {
    let user: UserUpload = { role: "Empleado" } as UserUpload;

    for (let i = 0; i < userKeys.length; i++) {
      const key = userKeys[i];
      let cellValue = row[i];

      if (typeof cellValue === "undefined" || cellValue === null) {
        cellValue = "";
      }

      if (key === "numberOfCoupons") {
        const event = events.find(e => e.name === user.eventName);

        if (!event) {
          throw new Error(`Evento no encontrado, fila del excel: ${rows.indexOf(row) + 2}`);
        }

        const numberOfCoupons = (cellValue ? Number(cellValue) : 0) || event?.couponsByEmployee || 0;

        if (typeof numberOfCoupons !== "number" || isNaN(numberOfCoupons) || !numberOfCoupons) {
          console.log("error", rows.indexOf(row) + 2);
          throw new Error(`Valor inválido en la cantidad de cupones, fila del excel: ${rows.indexOf(row) + 2}`);
        }

        user = { ...user, [key]: numberOfCoupons, eventId: event?.id || "" };
        continue;
      }

      if (key === "email" && isObject(cellValue) && "text" in cellValue) {
        cellValue = cellValue.text;
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

export const getLastCouponNumberByEventsName = async () => {
  try {
    const queryEventsConstraints: QueryConstraint[] = [];

    const events = await getCollectionGeneric<Event>("Events", queryEventsConstraints);

    const eventChunks = getArrayChunk(events, 10);

    const lastNumbersByEvent: Record<string, number> = {};

    for (const eventChunk of eventChunks) {
      const lastNumbersPromises = eventChunk.map((event) => {
        const queryCouponsConstraints: QueryConstraint[] = [
          where("eventId", "==", event.id),
          orderBy("number", "desc"),
          limit(1)
        ];

        const coupons = getCollectionGeneric<Coupon>("Coupons", queryCouponsConstraints);

        return coupons;
      });

      const couponsByEvents = (await (Promise.all(lastNumbersPromises))).flat();

      for (const coupon of couponsByEvents) {
        const lastNumber = coupon.number || 0;
        lastNumbersByEvent[coupon.eventId] = lastNumber;
      }
    }

    return { lastNumbersByEvent, events };
  } catch (error) {
    console.log(error);
    throw new Error("Error al obtener el último número de cupón por evento.");
  }
};
