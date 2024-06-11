import {format, differenceInMinutes, parse, isDate} from "date-fns";


const SPAN_CLASS = 'working-time';
const GAP_THRESHOLD = 1;

const calcWorkingMinutes = (hoursArray: Date[]) => {
    if (hoursArray.length === 0) return 0;

    // If the last entry is not a pair, add the current time as a Date object
    if (hoursArray.length % 2 !== 0) {
        hoursArray.push(new Date());
    }

    let totalMinutes = 0;

    // Iterate through the array in pairs to calculate the total working minutes
    for (let i = 0; i < hoursArray.length; i += 2) {
        if (i + 1 < hoursArray.length) {
            totalMinutes += differenceInMinutes(hoursArray[i + 1], hoursArray[i]);
        }
    }

    return totalMinutes;
}

const appendSpan = ({element, minutes, showOutTime = true}: { element: HTMLElement, minutes: number, showOutTime?: boolean }) => {
    if (isNaN(minutes) || !element) return;
    const existingSpan = element.querySelector('.working-time');
    if (existingSpan !== null) element.removeChild(existingSpan);
    const span = document.createElement('span');
    span.className = SPAN_CLASS;
    const shouldWorkMinutes = 8 * 60;

    const diff = minutes - shouldWorkMinutes;

    if (diff < -120) span.style.color = 'red';
    else if (diff < 0) span.style.color = 'darkorange';
    else span.style.color = 'green';
    span.style.fontWeight = 'bold';
    span.style.whiteSpace = 'pre-wrap'
    span.style.width = '100%'
    span.style.textAlign = 'left'
    const date = new Date((Math.abs(diff) - 60) * 60 * 1000);
    let outDate = new Date((Date.now() + (Math.abs(diff) * 60 * 1000)))
    let outMinutes = outDate.getMinutes() < 10 ? `0${outDate.getMinutes()}` : outDate.getMinutes()
    let outString = diff < 0 ? ` (saída às ${outDate.getHours()}:${outMinutes})` : ''
    const formatted = format(date, 'HH:mm');
    span.innerText = `   ${diff < 0 ? '-' : '+'} ${formatted} ${showOutTime ? outString : ""} ⌛`;
    element.appendChild(span);
}

const getWorkingTime = (dayElement: HTMLElement): number => {

    if (dayElement === null) return 0;

    // Remove existing spans
    dayElement.querySelectorAll(`.${SPAN_CLASS}`)?.forEach(span => dayElement.removeChild(span));

    // Split current day hours string
    let currentDayHoursStr = dayElement.innerText.split(' | ');
    if (currentDayHoursStr.length === 0) return 0;

    // Parse the time strings into Date objects
    let currentDayHours = currentDayHoursStr.map((hour) => {
        const date = parse(hour, 'HH:mm', new Date());
        if (isDate(date)) return date;
        return null;
    })
        .filter((date) => date !== null)
        .sort((a, b) => a!.getTime() - b!.getTime());


    // Remove entries that are too close to each other
    currentDayHours = currentDayHours.filter((date, index) => {
        if (index === 0) return true;
        const previousDate = currentDayHours[index - 1];
        return differenceInMinutes(date!, previousDate!) > GAP_THRESHOLD;
    });

    return calcWorkingMinutes(currentDayHours as Date[]);
}

const setResultsTable = () => {
    if (document.querySelectorAll(`.${SPAN_CLASS}`).length > 0) return;
    const rows = document.querySelectorAll('[id*=ctl00_ASPxSplitter_cphContent_grid_DXDataRow]');
    if (rows.length > 0) {
        rows.forEach(row => {
            const columns = row?.children;
            let hours: string[] = []
            hours.push(columns[7].innerHTML)
            hours.push(columns[8].innerHTML)
            hours.push(columns[9].innerHTML)
            hours.push(columns[10].innerHTML)
            const dates = hours.reduce((acc: Date[], curr) => {
                if (/\d\d:\d\d/.test(curr.toString())) acc.push(parse(curr.toString(), 'HH:mm', new Date()))
                return acc
            }, [])
            if (hours.length === 0) return;
            const workingMinutes = calcWorkingMinutes(dates);
            if (workingMinutes === 0) return;
            columns[11].innerHTML = '';
            appendSpan({element: columns[11] as HTMLElement, minutes: workingMinutes, showOutTime: false})
        })
    }
    setInterval(setResultsTable, 1000 * 5);
}

const setWorkingTime = () => {
    const currentDay = document.getElementById('ctl00_ASPxSplitter_cphContent_painelMovimentosAssiduidade_WMovimentosAssiduidade_cpMovimentosAssiduidade_txtDiaCorrente');
    const previousDay = document.getElementById('ctl00_ASPxSplitter_cphContent_painelMovimentosAssiduidade_WMovimentosAssiduidade_cpMovimentosAssiduidade_txtDiaAnterior');


    let currentDayWorkingTime = 0;
    let previousDayWorkingTime = 0;

    if (currentDay !== null) {
        currentDayWorkingTime = getWorkingTime(currentDay);
    }
    if (previousDay !== null) {
        previousDayWorkingTime = getWorkingTime(previousDay);
    }

    appendSpan({element: currentDay as HTMLElement, minutes: currentDayWorkingTime});
    appendSpan({element: previousDay as HTMLElement, minutes: previousDayWorkingTime, showOutTime: false});

    setInterval(setWorkingTime, 1000 * 60);
}


setWorkingTime();
setResultsTable();

const registerButton = document.getElementById('ctl00_ASPxSplitter_cphContent_painelMarcacaoAssiduidade_wMarcacaoAssiduidade_cpMarcacaoAssiduidadeBase_btnRegistarAssiduidadeBase');
if (registerButton) {
    registerButton.addEventListener('click', () => {
        setTimeout(() => {
            setWorkingTime();
            setResultsTable();
        }, 1000)
    })
}

export default {}