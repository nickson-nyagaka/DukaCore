FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY . /app
RUN pip install --upgrade pip && pip install -r Config/requirements.txt

EXPOSE 8000

CMD ["python", "Config/manage.py", "runserver", "0.0.0.0:8000"]
