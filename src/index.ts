import {format, differenceInMinutes, parse, isDate} from "date-fns";


const SPAN_CLASS = 'working-time';
const calcWorkingMinutes = (hoursArray: Date[]) => {
    if (hoursArray.length <= 1) return 0;
    if (hoursArray.length < 4) {
        const [first, second] = hoursArray;
        return differenceInMinutes(second, first);
    }
    if (hoursArray.length === 4) {
        const [first, second, third, fourth] = hoursArray;
        return differenceInMinutes(second, first) + differenceInMinutes(fourth, third);
    }
    return 0;
}

const appendSpan = ({element, minutes, showOutTime = true}: {element: HTMLElement, minutes: number, showOutTime?: boolean}) => {
    if(isNaN(minutes)) return;
    const existingSpan = element.querySelector('.working-time');
    if (existingSpan !== null) element.removeChild(existingSpan);
    const span = document.createElement('span');
    span.className = SPAN_CLASS;
    const shouldWorkMinutes = 8*60;

    const diff = minutes - shouldWorkMinutes;

    if (diff < -120 ) span.style.color = 'red';
    else if (diff < 0) span.style.color = 'darkorange';
    else span.style.color = 'green';
    span.style.fontWeight = 'bold';
    span.style.whiteSpace = 'pre-wrap'
    span.style.width = '100%'
    span.style.textAlign = 'left'
    const date = new Date((Math.abs(diff)-60) * 60 * 1000);
    let outDate = new Date((Date.now() + (Math.abs(diff)*60*1000)))
    let outMinutes = outDate.getMinutes() < 10 ? `0${outDate.getMinutes()}`: outDate.getMinutes()
    let outString = diff < 0 ? ` (saída às ${outDate.getHours()}:${outMinutes})`: ''
    const formatted = format(date, 'HH:mm');
    span.innerText = `   ${diff < 0 ? '-': '+'} ${formatted} ${showOutTime ? outString : ""} ⌛`;
    element.appendChild(span);
}

const setCurrentDay = () => {
    const currentDay = document.getElementById('ctl00_ASPxSplitter_cphContent_painelMovimentosAssiduidade_WMovimentosAssiduidade_cpMovimentosAssiduidade_txtDiaCorrente')
    if (currentDay !== null) {
        currentDay.querySelectorAll(`.${SPAN_CLASS}`).forEach(span => currentDay.removeChild(span))
        let currentDayHoursStr = currentDay?.innerText?.split(' - ')
        if (currentDayHoursStr.length  === 0) return;
        if (currentDayHoursStr.length < 4) {
            currentDayHoursStr.push(format(new Date(), 'HH:mm'))
        }
        let currentDayHours = currentDayHoursStr.map((hour) => {
            const date = parse(hour, 'HH:mm', new Date())
            if (isDate(date)) return date;
            return null;
        }).filter((date) => date !== null) as Date[];
        const workingMinutes = calcWorkingMinutes(currentDayHours);
        appendSpan({element: currentDay, minutes: workingMinutes});
    }
    setTimeout(setCurrentDay, 1000*60)
}

const setPreviousDay = () => {
    const previousDay = document.getElementById('ctl00_ASPxSplitter_cphContent_painelMovimentosAssiduidade_WMovimentosAssiduidade_cpMovimentosAssiduidade_txtDiaAnterior')
    if (previousDay !== null) {
        const lastDayHours = previousDay?.innerText?.split(' - ')
        if (lastDayHours.length === 0) return;
        const lastDayHoursParsed = lastDayHours.map((hour) => {
            const date = parse(hour, 'HH:mm', new Date())
            if (isDate(date)) return date;
            return null
        }).filter((date) => date !== null) as Date[];
        const workingMinutes = calcWorkingMinutes(lastDayHoursParsed);
        appendSpan( {element: previousDay, minutes: workingMinutes});
    }
}

const setResultsTable = () => {
    if(document.querySelectorAll(`.${SPAN_CLASS}`).length > 0) return;
    const rows = document.querySelectorAll('[id*=ctl00_ASPxSplitter_cphContent_grid_DXDataRow]');
    if (rows.length > 0) {
        rows.forEach(row => {
            const columns = row?.children;
            let hours: string[] = []
            hours.push(columns[6].innerHTML)
            hours.push(columns[7].innerHTML)
            hours.push(columns[8].innerHTML)
            hours.push(columns[9].innerHTML)
            const dates = hours.reduce((acc: Date[], curr) => {
                if (/\d\d:\d\d/.test(curr.toString())) acc.push( parse(curr.toString(), 'HH:mm', new Date()) )
                return acc
            }, [])
            if (hours.length === 0) return;
            const workingMinutes = calcWorkingMinutes(dates);
            if (workingMinutes === 0) return;
            columns[11].innerHTML = '';
            appendSpan({element: columns[11] as HTMLElement, minutes: workingMinutes, showOutTime: false})
        })
    }
    setTimeout(setResultsTable, 1000)
}


setPreviousDay();
setCurrentDay();
setResultsTable();

export default {}